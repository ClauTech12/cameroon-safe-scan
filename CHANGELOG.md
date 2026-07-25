# Changelog

All notable changes to CamAlert are documented here. This log starts
being kept rigorously from **2026-07-24** onward; entries before that
are a condensed summary of the project's earlier history rather than a
commit-by-commit account.

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
