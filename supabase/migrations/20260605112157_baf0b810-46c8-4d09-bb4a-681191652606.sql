
-- 1) Drop the hardcoded admin-email bootstrap trigger/function
DROP TRIGGER IF EXISTS on_auth_user_created_bootstrap_admin ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated_bootstrap_admin ON auth.users;
DROP FUNCTION IF EXISTS public.bootstrap_admin_email();

-- 2) Restrict public access to sensitive reporter columns on scam_reports.
-- Authenticated users (submitters viewing their own / admins) keep full access via existing RLS.
REVOKE SELECT (contact_info, reporter_name) ON public.scam_reports FROM anon;

-- 3) Force INSERTs on scam_reports to start as 'pending' (blocks moderation bypass).
DROP POLICY IF EXISTS "Anyone can submit reports" ON public.scam_reports;
CREATE POLICY "Anyone can submit reports"
  ON public.scam_reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'::report_status
    AND char_length(description) BETWEEN 10 AND 5000
    AND (submitter_id IS NULL OR submitter_id = auth.uid())
  );

-- 4) Tighten abuse_reports INSERT to prevent submitter impersonation.
DROP POLICY IF EXISTS "Anyone can submit abuse reports" ON public.abuse_reports;
CREATE POLICY "Anyone can submit abuse reports"
  ON public.abuse_reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(reason) BETWEEN 5 AND 1000
    AND (submitter_id IS NULL OR submitter_id = auth.uid())
  );

-- 5) phone_status: only count approved reports
CREATE OR REPLACE FUNCTION public.phone_status(_phone text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  canonical text;
  total int;
  recent int;
  status text;
  label text;
BEGIN
  IF _phone IS NULL OR length(_phone) = 0 THEN
    RETURN jsonb_build_object('status','unknown','total',0,'recent_24h',0);
  END IF;
  canonical := right(regexp_replace(_phone, '\D', '', 'g'), 9);

  SELECT count(*) INTO total
    FROM scam_reports
    WHERE phone_number = canonical
      AND status = 'approved';

  SELECT count(*) INTO recent
    FROM scam_reports
    WHERE phone_number = canonical
      AND status = 'approved'
      AND created_at > now() - interval '24 hours';

  IF total >= 5 OR recent >= 3 THEN
    status := 'high_risk_scam'; label := 'High Risk Scam';
  ELSIF total >= 3 THEN
    status := 'suspicious'; label := 'Suspicious';
  ELSIF total >= 1 THEN
    status := 'unverified'; label := 'Unverified';
  ELSE
    status := 'unknown'; label := 'No Reports';
  END IF;

  RETURN jsonb_build_object(
    'phone', canonical,
    'status', status,
    'label', label,
    'total', total,
    'recent_24h', recent,
    'spike', recent >= 3
  );
END;
$$;

-- 6) report_explainability: only count approved reports in risk math
CREATE OR REPLACE FUNCTION public.report_explainability(_report_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  total int := 0;
  recent int := 0;
  related_ids uuid[] := '{}';
  reports_score int := 0;
  pattern_score int := 0;
  ai_score int := 0;
  final_score int;
  status text;
  status_label text;
  pattern_match boolean := false;
BEGIN
  SELECT id, phone_number, scam_type, ai_confidence, risk_level, description,
         created_at, status
    INTO r
    FROM scam_reports
    WHERE id = _report_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error','not_found');
  END IF;

  IF r.phone_number IS NOT NULL THEN
    SELECT count(*) INTO total
      FROM scam_reports
      WHERE phone_number = r.phone_number
        AND status = 'approved';

    SELECT count(*) INTO recent
      FROM scam_reports
      WHERE phone_number = r.phone_number
        AND status = 'approved'
        AND created_at > now() - interval '24 hours';

    SELECT coalesce(array_agg(id ORDER BY created_at DESC), '{}')
      INTO related_ids
      FROM (
        SELECT id, created_at FROM scam_reports
        WHERE phone_number = r.phone_number
          AND id <> r.id
          AND status = 'approved'
        ORDER BY created_at DESC
        LIMIT 3
      ) s;

    SELECT count(*) >= 2 INTO pattern_match
      FROM scam_reports
      WHERE phone_number = r.phone_number
        AND id <> r.id
        AND scam_type = r.scam_type
        AND status = 'approved';
  END IF;

  reports_score := least(40, total * 10);
  pattern_score := CASE WHEN pattern_match THEN 25 ELSE 0 END
                 + CASE WHEN recent >= 3 THEN 15 ELSE 0 END;
  ai_score := least(35, coalesce(r.ai_confidence,0) * 35 / 100);

  final_score := least(100, reports_score + pattern_score + ai_score);

  IF r.phone_number IS NULL THEN
    status := 'unverified'; status_label := 'Unverified';
  ELSIF total >= 5 OR recent >= 3 THEN
    status := 'high_risk_scam'; status_label := 'High Risk Scam';
  ELSIF total >= 3 THEN
    status := 'suspicious'; status_label := 'Suspicious';
  ELSE
    status := 'unverified'; status_label := 'Unverified';
  END IF;

  RETURN jsonb_build_object(
    'report_id', r.id,
    'phone', r.phone_number,
    'scam_type', r.scam_type,
    'ai_confidence', coalesce(r.ai_confidence, 0),
    'total_reports', total,
    'recent_24h', recent,
    'pattern_match', pattern_match,
    'spike', recent >= 3,
    'status', status,
    'status_label', status_label,
    'related_report_ids', related_ids,
    'risk', jsonb_build_object(
      'reports', reports_score,
      'pattern', pattern_score,
      'ai', ai_score,
      'total', final_score
    )
  );
END;
$$;
