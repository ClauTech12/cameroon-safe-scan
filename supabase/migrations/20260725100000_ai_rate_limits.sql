-- Rate limiting for the public AI-calling Edge Functions (chat-assistant,
-- classify-scam, analyze-scam). These call Google Gemini, a paid API, and
-- were previously unprotected against scripted abuse -- the only "429"
-- handling in those functions forwards Gemini's own rate-limit response;
-- nothing on CamAlert's side capped how often a single caller could hit
-- them. This mirrors the existing report_rate_limits pattern used for
-- report submissions, but as a shared table since these three functions
-- have distinct, lighter limits appropriate to their own usage patterns.
--
-- detect-pattern is intentionally NOT covered here -- it already requires
-- a verified admin JWT (requireAdmin), so it isn't reachable by anonymous
-- callers in the first place.

CREATE TABLE public.ai_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  endpoint text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_rate_limits_lookup ON public.ai_rate_limits(ip_hash, endpoint, created_at);

ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT policies for anon/authenticated -- only the Edge
-- Functions write here, using the service-role key, which bypasses RLS.
-- This table holds no personal data (just a salted IP hash + endpoint
-- name + timestamp), but there's no reason to expose it to any client.
