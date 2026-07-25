# Contributing to CamAlert

CamAlert is a proprietary project (see [LICENSE](./LICENSE)), but this
guide is for anyone with access to contribute directly — collaborators,
future team members, or contracted developers.

## Before you start

1. Read the [README](./README.md) for project setup and architecture.
2. Make sure `npm run verify` passes cleanly on a fresh checkout before
   you start making changes — that's your baseline.

## Development workflow

1. Create a branch off `main` for your change:
   ```bash
   git checkout -b fix/short-description
   ```
2. Make your change. Keep commits focused — one logical change per commit.
3. **Run the full verify pipeline before committing:**
   ```bash
   npm run verify
   ```
   This runs typecheck → lint → tests → build, in that order, and stops
   at the first failure. Don't skip this — it's also wired up as the
   default VS Code build task (`Ctrl+Shift+B`).
4. If your change touches user-facing text, **update all three locale
   files** (`src/i18n/locales/en.ts`, `fr.ts`, `pcm.ts`). CamAlert is
   fully trilingual — a change that only updates English is incomplete.
5. If your change touches the database (new tables, columns, policies,
   functions), add a new migration file under `supabase/migrations/`
   rather than editing an existing one — migrations are chronological
   and already-applied ones should never change.
6. If your change adds new logic to `src/lib/`, add tests for it under
   `src/lib/__tests__/`. That's where the fraud-detection heuristics
   live, and it's the part of the codebase most worth protecting with
   real test coverage.

## Edge Functions

If you add a new public-facing Edge Function (anything callable by
`anon`, not just admins):
- Decide whether it needs `requireSupabaseCaller()` or `requireAdmin()`
  from `_shared/auth.ts` — but check the function's `verify_jwt` setting
  in `supabase/config.toml` first. These auth helpers rely on the
  gateway having already verified the JWT (`verify_jwt = true`); adding
  one to a `verify_jwt = false` function doesn't work reliably and has
  already caused a real outage once — see `docs/ARCHITECTURE.md`.
- If the function calls an external paid API (Gemini) or does anything
  that costs money per call, add rate limiting via
  `checkAiRateLimit()` from `_shared/rate-limit.ts`. Don't assume the
  frontend's own request pattern is the only way the function will
  ever be called — any public Edge Function can be hit directly.

## Database changes

- Every migration should be safe to re-run without breaking anything if
  it's already been applied (use `IF NOT EXISTS`, `IF EXISTS`, or a
  guard check where relevant).
- Any table exposed to `anon`/`authenticated` roles needs an explicit
  RLS policy — remember RLS controls rows, not columns. If a table has
  any sensitive column (contact info, internal notes), don't rely on
  the frontend to "just not select it" — anyone with the anon key can
  query any column directly. Use a view to expose only safe columns
  where public read access is needed.

## Commit messages

Keep them short and descriptive: what changed and why, not how.

```
Fix: PII exposure on scam_reports via safe public view
Add: rule-engine accuracy tracking against admin verdicts
```

## Pull requests / review

- Describe what changed and why, not just what files were touched.
- Call out any migration that needs to be run manually against
  Supabase (via the SQL Editor or `supabase db push`) — a merged PR
  doesn't automatically apply database changes.
- Flag anything that needs a new environment variable or Supabase
  secret so it doesn't silently break in production.

## Questions

If something in the codebase doesn't make sense, ask rather than guess
— especially around anything security- or privacy-related. Reach out at
clauvetmt19988@gmail.com.
