-- Fix: RLS restricts ROWS, not COLUMNS. "Approved reports are public" let
-- anon + authenticated SELECT the *entire* approved row via direct REST
-- calls -- including contact_info and submitter_id -- regardless of what
-- the frontend app chooses to select. Since the Supabase anon key is
-- public (shipped in the JS bundle), anyone could query those columns
-- directly, bypassing the app UI entirely.
--
-- Fix: replace the broad table-level public policy with a safe VIEW that
-- exposes only non-sensitive columns for approved reports. Views run with
-- the privileges of their owner by default, so this view can read the
-- base table even though the underlying "public" SELECT policy is being
-- removed. Admins (via "Admins view all reports") and submitters viewing
-- their own report (via "Submitters can view their own reports") are
-- untouched -- they still read the base table directly and legitimately
-- see contact_info as their own data.

CREATE OR REPLACE VIEW public.public_scam_reports
WITH (security_barrier = true) AS
SELECT
  id, location, description, scam_type, ai_confidence, ai_advice,
  risk_level, status, created_at, phone_number, reporter_name
FROM public.scam_reports
WHERE status = 'approved';

REVOKE ALL ON public.public_scam_reports FROM PUBLIC;
GRANT SELECT ON public.public_scam_reports TO anon, authenticated;

-- Remove the policy that exposed all columns of approved reports to
-- anon + authenticated via the base table.
DROP POLICY IF EXISTS "Approved reports are public" ON public.scam_reports;
