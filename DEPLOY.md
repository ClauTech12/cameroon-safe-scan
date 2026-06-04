# CamAlert — production deploy checklist

## Supabase Edge Functions

Deploy after any change under `supabase/functions/`:

```bash
supabase login
supabase link --project-ref tdolkwvvzqtquwcuchyq
supabase db push
supabase functions deploy analyze-scam
supabase functions deploy check-rate-limit
supabase functions deploy classify-scam
supabase functions deploy detect-pattern
```

If `supabase link` fails with *"account does not have the necessary privileges"*, use the Supabase account that owns the project (or get invited in **Project Settings → Team**), or deploy via Lovable’s Supabase integration.

## Required secrets (Supabase Dashboard → Edge Functions → Secrets)

| Secret | Used by |
|--------|---------|
| `LOVABLE_API_KEY` | `analyze-scam`, `classify-scam`, `detect-pattern` |

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically on hosted Supabase.

## Frontend

Set in your host (Lovable / Vercel / Netlify) or local `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID` (optional)

Copy from `.env.example`. Never commit `.env`.

## First admin

1. Sign up at `/auth`
2. Use **Claim first admin** once, or insert a row in `user_roles` with role `admin`
