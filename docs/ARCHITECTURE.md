# Architecture

A technical overview of how CamAlert is put together, for anyone picking
up this codebase after the README.

## High level

```
React (Vite, TypeScript) ──▶ Supabase (Postgres + RLS)
        │                          │
        │                          ├─▶ Edge Functions (Deno) ──▶ Google Gemini
        │                          └─▶ Storage (screenshots)
        └──▶ Vercel (hosting + CDN)
```

There's no separate backend server — Supabase *is* the backend. Business
logic lives in three places, in order of preference:

1. **Postgres functions + RLS policies** (fastest, runs closest to the
   data, no cold start) — used for all risk scoring and access control
2. **Database triggers** — used for anything that should happen
   automatically as a side effect of a row change (see "Notifications"
   below)
3. **Edge Functions** — used only when something needs to call an
   external API (Gemini) or needs logic too complex/stateful for SQL

## Database schema (key tables)

| Table | Purpose |
|---|---|
| `scam_reports` | User-submitted reports. Public approved rows are exposed only through the `public_scam_reports` **view** (see below) — never the raw table. |
| `flagged_numbers` | Admin-set risk status per phone number (`under_investigation` / `confirmed_scam` / `cleared`). |
| `risk_prediction_labels` | Auto-populated snapshot of what the rule engine predicted vs. what an admin later confirmed — the dataset a future ML model would train against. |
| `user_roles` | Role assignments (currently just `admin`), checked via `has_role()` in RLS policies. |

## RLS is row-level, not column-level

This is the single most important thing to understand about this
codebase's security model. A `SELECT` policy controls which **rows** a
role can see — it does **not** hide specific **columns**. If a table has
a sensitive column (contact info, internal notes) and any policy grants
broad `SELECT` access to `anon` or `authenticated`, that column is
readable by anyone who has the public anon key and queries the REST API
directly — regardless of what the frontend app chooses to `.select()`.

**Pattern used here:** where a table has both public-safe and sensitive
columns, public read access goes through a `SECURITY DEFINER`-style view
(owned by the table owner, so it can read the base table on the caller's
behalf) that exposes only the safe columns and safe rows. The base table
itself keeps a narrower policy for the roles that actually need full
access (admins, or a user reading their own submitted data).
See `public_scam_reports` for a concrete example, and the migration
`20260724140000_scam_reports_pii_fix.sql` for the reasoning.

## Risk scoring

Three Postgres functions compute risk, called at different points:

- **`phone_status(phone)`** — the primary lookup used by "Check a
  Number" and MoMo Guard. Returns a status (`high_risk_scam` /
  `suspicious` / `unverified` / `unknown`) based on report count,
  recency (a 24h spike counts as a stronger signal), and whether
  multiple people reported the same scam type.
- **`number_intel_summary(phone)`** — the richer version used by the
  admin Number Intelligence page, returning a full 0–100 score
  breakdown.
- **`report_explainability(report_id)`** — explains *why* a single
  report scored the way it did, for the admin-facing "why this result"
  view.

None of this is machine learning — it's transparent, auditable
heuristics. `risk_prediction_labels` (populated automatically whenever
an admin sets a flag status) exists specifically so that, once there's
enough real labeled data, a real model could be trained and validated
against it. Until then, the accuracy tracker on `/admin/accuracy` shows
how well the heuristics already match human judgment.

## Fraud heuristics (client + AI, two independent layers)

`src/lib/analyzer.ts` is a pure, dependency-free rule engine (no
network calls) used by the AI Analyzer page for instant feedback on
pasted text/URLs/phone numbers — pattern-matching for urgency language,
money requests, OTP phishing, brand impersonation, suspicious domains,
etc. It's fully unit-tested (`src/lib/analyzer.test.ts` and friends) —
this is the highest-value code to keep test coverage on, since a
regression here directly affects whether real scams get flagged.

Separately, Edge Functions (`classify-scam`, `detect-pattern`,
`analyze-scam`, `chat-assistant`) call Google Gemini for a second,
independent AI-based read. The two layers are intentionally
non-overlapping: the client-side rules work instantly with zero cost
and no dependency on an external API being up; Gemini adds broader
language understanding the hand-written rules can't capture.

## Notifications / side effects via triggers, not queues

Where possible, side effects (like emails) happen via Postgres triggers
calling out through `pg_net` directly — no Edge Function, no queue, no
polling. It happens synchronously in the same transaction as the row
change that triggered it. This keeps the moving-parts count low; revisit
this decision only if/when volume genuinely requires a real queue.

## i18n

Every user-facing string lives in `src/i18n/locales/{en,fr,pcm}.ts` as
plain nested objects (not JSON) — see `src/i18n/index.ts` for how
they're loaded into i18next. **Any change to user-facing text needs to
update all three files** — see `CONTRIBUTING.md`.

## Frontend structure

- Every route is lazy-loaded (`React.lazy`) from `src/App.tsx` — this
  keeps the initial bundle down since most users only ever visit a
  handful of pages. If you add a new route, lazy-load it the same way.
- Heavy, occasionally-used dependencies (e.g. `react-markdown`, used
  only inside the floating AI chat assistant) should be split out into
  their own small wrapper component and lazy-loaded independently, even
  if the component that uses them isn't itself lazy — see
  `src/components/MarkdownMessage.tsx` for the pattern.
- `npm run verify` (typecheck → lint → test → build) is the single
  source of truth for "is this change safe to ship" — it's also the
  default VS Code build task.

## Deployment

- **Frontend:** Vercel, auto-deploys on push to `main`
- **Backend:** Supabase project — migrations under
  `supabase/migrations/` must be applied manually (SQL Editor or
  `supabase db push`); pushing to `main` does **not** apply them
  automatically
- **Secrets:** Gemini API key lives as a Supabase Edge Function secret,
  never in the frontend bundle
