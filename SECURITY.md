# Security Policy

CamAlert handles scam reports that can include personal information
(phone numbers, screenshots, optional contact details), so we take
security and privacy seriously.

## Reporting a vulnerability

If you discover a security or privacy issue — anything from a data
exposure, an authentication bypass, an injection vulnerability, or a way
to see data you shouldn't be able to see — please report it privately
rather than opening a public GitHub issue.

**Email:** clauvetmt19988@gmail.com
**Subject line:** `[SECURITY] short description`

Please include:
- A description of the issue and its potential impact
- Steps to reproduce it (as specific as possible)
- Any relevant URLs, request/response examples, or screenshots
- Whether you've already disclosed it anywhere else

We'll acknowledge your report as soon as possible and keep you updated
as we investigate and fix it. Please give us a reasonable window to
address the issue before disclosing it publicly.

## Scope

This policy covers:
- The CamAlert web application (camalert.org)
- The Supabase backend (database RLS policies, Edge Functions)
- This source code repository

It does **not** cover:
- Third-party services CamAlert depends on (Supabase, Vercel, Google
  Gemini) — please report those directly to the relevant provider
- Social engineering, physical attacks, or denial-of-service testing
  against production infrastructure

## What we ask contributors and researchers not to do

- Don't access, modify, or delete data beyond what's needed to
  demonstrate a vulnerability
- Don't use automated scanning tools against production in a way that
  degrades service for real users reporting real scams
- Don't publicly disclose a vulnerability before it's been addressed

Thank you for helping keep CamAlert and the people who rely on it safe.
