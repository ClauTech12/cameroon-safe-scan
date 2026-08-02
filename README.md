# CamAlert

**Community-driven scam reporting and fraud intelligence for Cameroon.**

CamAlert lets anyone report a scam — mobile money fraud, phishing links, fake
job offers, impersonation calls — and see aggregated, anonymized intelligence
on phone numbers and scam patterns already reported by others. It combines
rule-based fraud detection with AI-assisted risk scoring (Google Gemini) to
help people recognize and avoid fraud before it costs them money.

Built for Cameroon first, with a roadmap to expand across Africa.

🔗 Live: [camalert.org](https://camalert.org)

---

## Features

- **Report a scam** — mobile money fraud, phishing, fake jobs, bank/impersonation
  scams, with optional screenshot upload
- **Check a number** — look up a phone number's report history and risk level
  before trusting a call or MoMo request
- **MoMo Guard** — a dedicated mobile-money fraud checker and recent-reports feed
- **AI Analyzer** — paste a suspicious SMS/URL/message and get an instant
  heuristic + AI risk assessment with an explanation of *why* it's risky
- **Public dashboard** — aggregated, anonymized stats on scam trends by type
  and region
- **Admin console** — report moderation, phone-number intelligence, fraud
  pattern detection, a live fraud heatmap, and a rule-engine accuracy tracker
  that compares automatic risk scoring against admin-confirmed outcomes
- **Fully trilingual** — English, French, and Cameroonian Pidgin, switchable
  anywhere in the app

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix primitives) |
| Routing / state | React Router, TanStack Query |
| Backend | Supabase (Postgres, Edge Functions on Deno, Row-Level Security, Storage) |
| AI | Google Gemini (via Supabase Edge Functions) |
| i18n | i18next / react-i18next (en, fr, pcm) |
| Testing | Vitest |
| Hosting | Vercel |

## Getting started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is enough for development)

### Setup

```bash
git clone https://github.com/ClauTech12/cameroon-safe-scan.git
cd cameroon-safe-scan
npm install
cp .env.example .env
```

Fill in `.env` with your Supabase project's URL and public anon key (Supabase
dashboard → Settings → API):

```
VITE_SUPABASE_PROJECT_ID=your-project-ref
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
```

Apply the database schema — every migration under `supabase/migrations/`
needs to run against your Supabase project, either via the Supabase CLI:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

or by pasting each migration file's contents into the Supabase Dashboard's
SQL Editor in order (oldest first).

The Edge Functions under `supabase/functions/` (AI classification, pattern
detection, rate limiting) also need to be deployed to your Supabase project
and given a `GEMINI_API_KEY` secret to call the Gemini API.

### Run it

```bash
npm run dev
```

App runs at `http://localhost:8080`.

### Other useful commands

```bash
npm run typecheck    # TypeScript, no emit
npm run lint          # ESLint
npm run test          # Vitest unit tests
npm run build         # Production build
npm run verify         # typecheck + lint + test + build, in sequence
```

`npm run verify` is also wired up as the default VS Code build task
(`Ctrl+Shift+B` / `Cmd+Shift+B`) — see `.vscode/tasks.json`.

## Project structure

```
src/
  components/     Shared UI components (incl. shadcn/ui primitives)
  pages/          Route-level pages (public + admin/)
  lib/            Core logic: fraud heuristics, risk scoring, i18n helpers
  i18n/locales/   Translation files (en, fr, pcm)
  integrations/   Supabase client + generated types
supabase/
  migrations/     Database schema, RLS policies, functions (chronological)
  functions/      Edge Functions (Deno) — AI classification, rate limiting, etc.
docs/             Architecture notes and deeper technical documentation
```

## Security

If you find a security or privacy issue, please see [SECURITY.md](./SECURITY.md)
for how to report it responsibly — please don't open a public issue for
anything sensitive.

## Contributing

This is a proprietary project (see [LICENSE](./LICENSE)), but bug reports and
suggestions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for
guidelines if you have access to contribute directly.

## License

Proprietary — all rights reserved. See [LICENSE](./LICENSE) for details.

## Credits

Built by **Clauvet Agbor** — [ClauTech Digital Solutions](https://github.com/Agbor-Clauvet).
