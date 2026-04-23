-- ============================================================
-- 1) Rate-limit table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.report_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  phone_number text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_time
  ON public.report_rate_limits (ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_phone_time
  ON public.report_rate_limits (phone_number, created_at DESC);

ALTER TABLE public.report_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read rate limits"
  ON public.report_rate_limits FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- inserts only happen from edge function with service role — no public policy needed

-- ============================================================
-- 2) Helpful indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_scam_reports_phone_status_time
  ON public.scam_reports (phone_number, status, created_at DESC)
  WHERE phone_number IS NOT NULL;

-- ============================================================
-- 3) phone_status: threshold-based status for a phone number
-- ============================================================
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
    WHERE phone_number = canonical;

  SELECT count(*) INTO recent
    FROM scam_reports
    WHERE phone_number = canonical
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

-- ============================================================
-- 4) report_explainability: full breakdown for one report
-- ============================================================
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

  -- counts on the same phone (if any)
  IF r.phone_number IS NOT NULL THEN
    SELECT count(*) INTO total
      FROM scam_reports
      WHERE phone_number = r.phone_number;

    SELECT count(*) INTO recent
      FROM scam_reports
      WHERE phone_number = r.phone_number
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

    -- pattern match: 2+ other reports of the same scam_type on same phone
    SELECT count(*) >= 2 INTO pattern_match
      FROM scam_reports
      WHERE phone_number = r.phone_number
        AND id <> r.id
        AND scam_type = r.scam_type;
  END IF;

  -- risk components
  reports_score := least(40, total * 10);              -- max 40
  pattern_score := CASE WHEN pattern_match THEN 25 ELSE 0 END
                 + CASE WHEN recent >= 3 THEN 15 ELSE 0 END;  -- max 40
  ai_score := least(35, coalesce(r.ai_confidence,0) * 35 / 100);

  final_score := least(100, reports_score + pattern_score + ai_score);

  -- threshold status (only meaningful when phone is present)
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