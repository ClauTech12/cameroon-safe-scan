# Changelog

All notable changes to CamAlert are documented here. This log starts
being kept rigorously from **2026-07-24** onward; entries before that
are a condensed summary of the project's earlier history rather than a
commit-by-commit account.

## [1.1.0] — 2026-07-25 — Security audit + repo cleanup

A full security review pass, plus a codebase sweep for broken links,
dead code, and translation gaps.

### Added
- Rate limiting on the three public AI-calling Edge Functions
  (`chat-assistant`, `classify-scam`, `analyze-scam`) — previously
  none of them capped how often a single caller could invoke them,
  meaning scripted abuse could run up real Gemini API costs or exhaust
  Gemini's own rate limit for every legitimate user. New `ai_rate_limits`
  table tracks a salted IP hash + endpoint + timestamp (no personal
  data); a shared `checkAiRateLimit()` helper enforces per-endpoint
  limits and fails open on its own errors so a DB hiccup never takes
  down the AI features entirely.
- `analyzerPage.*` translation keys (en/fr/pcm) for the AI Analyzer
  page — see Fixed below.

### Fixed
- **`chat-assistant` had no authentication check of any kind** — the
  other two AI functions at least required a valid Supabase caller
  JWT; this one had nothing. Note: this function is deliberately
  configured with `verify_jwt = false` at the platform level (see
  `supabase/config.toml`), so it relies on the new rate limiting alone
  rather than a JWT check, which doesn't play well with that setting.
- **The entire AI Analyzer page ignored the language switcher.** Every
  string — title, all 5 tab labels, placeholders, both action buttons,
  every result label, the empty state — was hardcoded in English with
  zero calls into i18n, despite full trilingual support being a
  headline feature. Rewired the whole page onto proper translation
  keys.
- **Broken `/legal/terms`, `/legal/privacy`, `/legal/disclaimer` links**
  in the report submission form — the real routes have no `/legal/`
  prefix. Anyone clicking those on the report form hit a 404.
- **Wrong slug in `sitemap.xml`** — listed `/scams/mobile_money`
  (underscore) instead of the app's actual route,
  `/scams/mobile-money` (hyphen).
- Removed `PlaceholderPage.tsx`, an unused "coming soon" component
  left over from early admin scaffolding — no longer referenced
  anywhere.
- A migration and an Edge Function fix had each been applied directly
  to the live Supabase project (via the SQL editor and the CLI,
  respectively) without ever being committed to git, leaving the repo
  silently out of sync with what was actually running in production.
  Both are now tracked.

### Audited, no changes needed
- Row-Level Security is enabled on every table with correctly scoped
  policies; no privilege-escalation path in `user_roles`.
- Every `SECURITY DEFINER` function pins `search_path` correctly.
- Storage bucket policies (screenshot uploads) are properly hardened:
  size caps, MIME whitelist, UUID-only filenames, no public listing.
- `invite-admin` does real server-side JWT + admin-role verification.
- HTTP security headers (`vercel.json`) are thorough: HSTS w/ preload,
  a real CSP, frame/content-type/referrer/permissions policies.
- Translation key parity confirmed exact across en/fr/pcm (396/396/396).
- `npm audit` findings traced to source: all build-tooling only
  (ESLint/Tailwind/PostCSS dependency chains), none reachable from the
  shipped bundle or the Deno Edge Functions.
- One known, accepted risk: `react-router-dom` has a moderate
  open-redirect CVE; the fix requires a v6→v7 major upgrade with
  breaking API changes, scheduled as a dedicated task rather than
  rushed into this pass.

## [1.0.0] — 2026-07-25 — Pre-launch hardening

The push to get CamAlert ready for a custom domain and real traffic.

### Added
- **Rule-engine accuracy tracking** (`/admin/accuracy`) — every time an
  admin sets a phone number's flag status (Confirmed Scam / Cleared /
  Under Investigation), the system automatically snapshots what the
  rule engine had predicted at that moment. Shows accuracy %, false
  positive/negative counts, and a full prediction-vs-verdict matrix.
  This is also the dataset a future ML model would train against.
- Real unit test suite (38 tests) covering the fraud-detection
  heuristics in `src/lib/` — URL/text/phone analysis, phrase
  highlighting, tactic detection, and PII masking.
- `npm run verify` — a single command (typecheck → lint → test →
  build) wired up as the default VS Code build task
  (`Ctrl+Shift+B`), so a broken change is caught immediately during
  development instead of at deploy time.
- `sitemap.xml` covering all public routes, referenced from
  `robots.txt`.
- Full repo documentation: this changelog, `SECURITY.md`,
  `CONTRIBUTING.md`, `docs/ARCHITECTURE.md`, a real `README.md`, and a
  `LICENSE`.

### Fixed
- **Privacy:** `scam_reports.contact_info` and `submitter_id` were
  readable by anyone with the public anon key via direct REST calls,
  regardless of what the frontend selected — RLS restricts rows, not
  columns. Public reads now go through a `public_scam_reports` view
  exposing only safe columns; admins and a report's own submitter
  still see full data through their existing dedicated policies.
- **Data integrity:** `flagged_numbers.phone_number` was missing its
  intended `UNIQUE` constraint on the live database, causing every
  attempt to save a flag status to fail with a Postgres `ON CONFLICT`
  error.
- **False positives in fraud detection:** the URL analyzer's
  brand-impersonation check was flagging `google.com`,
  `microsoft.com`, `whatsapp.com`, `amazon.com`, and `dhl.com` as
  suspicious look-alike domains — the exclusion list only covered 4
  local brands. Found while writing test coverage.
- **Duplicate footer:** a bare-bones footer was rendered globally on
  every route in addition to the full-featured `SiteFooter` most
  pages already rendered themselves — nearly every page was showing
  two stacked footers.
- **Mobile navigation:** the public site header had no mobile
  handling at all (no hamburger menu, no branding) — rebuilt with a
  proper logo, desktop nav, and a slide-out mobile drawer.
- **Floating buttons overlapping on mobile:** the AI assistant launcher
  and the WhatsApp button occupied the same screen position below the
  `sm` breakpoint, with WhatsApp's higher z-index hiding the assistant
  entirely on phones.
- Double file extension (`og-image.png.png`) and a duplicate
  `og:image` meta tag that should have been `twitter:image` — social
  link previews weren't picking up the image correctly.

### Performance
- Split `react-markdown` (used only inside the AI chat assistant) into
  its own lazily-loaded chunk instead of shipping it in the main
  bundle on every page load — cut the initial JS payload from
  ~173 kB to ~145 kB gzipped (~16%).

## Earlier history (summary)

- **2026-04 – 2026-06:** Initial build on Lovable — core reporting
  flow, phone number lookup, admin dashboard, fraud heatmap, Supabase
  schema and RLS policies established.
- **2026-06:** Security hardening pass (HTTP security headers, image
  sizing for performance), CamAlert branding standardized across the
  app.
- **2026-07-02:** Cameroon Pidgin (pcm) added as a third supported
  language alongside English and French.
- **2026-07-02 – 2026-07-03:** Floating AI assistant added and
  polished.
- **2026-07-07 – 2026-07-08:** Migrated off the original Lovable-linked
  Supabase project to an independently owned one; migrated AI features
  to Google Gemini.
- **2026-07-13:** Removed remaining Lovable platform scaffolding;
  replaced favicon with CamAlert branding.
