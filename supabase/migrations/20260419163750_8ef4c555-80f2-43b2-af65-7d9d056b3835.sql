-- 1. Add normalized phone_number column on scam_reports
ALTER TABLE public.scam_reports
  ADD COLUMN IF NOT EXISTS phone_number text;

CREATE INDEX IF NOT EXISTS idx_scam_reports_phone_number
  ON public.scam_reports (phone_number)
  WHERE phone_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scam_reports_created_at
  ON public.scam_reports (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scam_reports_scam_type
  ON public.scam_reports (scam_type);

-- 2. Trigger function to extract a canonical phone from contact_info
CREATE OR REPLACE FUNCTION public.extract_phone_from_contact()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  digits text;
BEGIN
  IF NEW.contact_info IS NULL OR NEW.contact_info = '' THEN
    NEW.phone_number := NULL;
    RETURN NEW;
  END IF;

  -- skip if it looks like an email
  IF position('@' in NEW.contact_info) > 0 THEN
    NEW.phone_number := NULL;
    RETURN NEW;
  END IF;

  digits := regexp_replace(NEW.contact_info, '\D', '', 'g');
  IF length(digits) < 8 THEN
    NEW.phone_number := NULL;
  ELSE
    -- store last 9 digits as canonical key (Cameroon mobile = 9 digits)
    NEW.phone_number := right(digits, 9);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_extract_phone ON public.scam_reports;
CREATE TRIGGER trg_extract_phone
  BEFORE INSERT OR UPDATE OF contact_info ON public.scam_reports
  FOR EACH ROW EXECUTE FUNCTION public.extract_phone_from_contact();

-- backfill
UPDATE public.scam_reports SET contact_info = contact_info WHERE contact_info IS NOT NULL;

-- 3. Flagged numbers table
CREATE TYPE public.flag_status AS ENUM ('confirmed_scam', 'under_investigation', 'cleared');

CREATE TABLE public.flagged_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL UNIQUE,
  status public.flag_status NOT NULL DEFAULT 'under_investigation',
  notes text,
  flagged_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.flagged_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read flagged numbers"
  ON public.flagged_numbers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert flagged numbers"
  ON public.flagged_numbers FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update flagged numbers"
  ON public.flagged_numbers FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete flagged numbers"
  ON public.flagged_numbers FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_flagged_numbers_updated
  BEFORE UPDATE ON public.flagged_numbers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. number_intel_summary RPC (admin-only)
CREATE OR REPLACE FUNCTION public.number_intel_summary(_phone text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  canonical text;
  total int;
  high_count int;
  type_counts jsonb;
  region_counts jsonb;
  first_seen timestamptz;
  last_seen timestamptz;
  risk int;
  flag_row record;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  canonical := right(regexp_replace(coalesce(_phone,''), '\D', '', 'g'), 9);
  IF length(canonical) < 8 THEN
    RETURN jsonb_build_object('error','invalid_phone');
  END IF;

  SELECT count(*), count(*) FILTER (WHERE risk_level='high'),
         min(created_at), max(created_at)
    INTO total, high_count, first_seen, last_seen
    FROM scam_reports
    WHERE phone_number = canonical AND status = 'approved';

  SELECT jsonb_object_agg(scam_type, c) INTO type_counts FROM (
    SELECT scam_type::text, count(*) c FROM scam_reports
    WHERE phone_number = canonical AND status = 'approved'
    GROUP BY scam_type
  ) s;

  SELECT jsonb_object_agg(location, c) INTO region_counts FROM (
    SELECT location, count(*) c FROM scam_reports
    WHERE phone_number = canonical AND status = 'approved'
    GROUP BY location
  ) r;

  -- risk: 30 base per report (cap 60) + 30 if any high + 10 per region beyond 1 (cap 20)
  risk := least(60, coalesce(total,0) * 20)
        + CASE WHEN high_count > 0 THEN 30 ELSE 0 END
        + least(20, GREATEST(0, coalesce(jsonb_object_keys_count(region_counts),0) - 1) * 10);
  IF risk > 100 THEN risk := 100; END IF;

  SELECT * INTO flag_row FROM flagged_numbers WHERE phone_number = canonical;

  RETURN jsonb_build_object(
    'phone', canonical,
    'total_reports', coalesce(total,0),
    'high_risk_reports', coalesce(high_count,0),
    'first_seen', first_seen,
    'last_seen', last_seen,
    'type_counts', coalesce(type_counts, '{}'::jsonb),
    'region_counts', coalesce(region_counts, '{}'::jsonb),
    'risk_score', risk,
    'flag', CASE WHEN flag_row.id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', flag_row.id, 'status', flag_row.status, 'notes', flag_row.notes,
      'updated_at', flag_row.updated_at) END
  );
END;
$$;

-- helper: count keys of a jsonb object, returns 0 for null
CREATE OR REPLACE FUNCTION public.jsonb_object_keys_count(j jsonb)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN j IS NULL THEN 0 ELSE (SELECT count(*) FROM jsonb_object_keys(j))::int END
$$;

-- 5. top_reported_numbers RPC (admin-only)
CREATE OR REPLACE FUNCTION public.top_reported_numbers(_limit int DEFAULT 10)
RETURNS TABLE(phone_number text, report_count bigint, dominant_type scam_type, last_seen timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  WITH agg AS (
    SELECT sr.phone_number, count(*) c, max(sr.created_at) ls
    FROM scam_reports sr
    WHERE sr.phone_number IS NOT NULL AND sr.status = 'approved'
    GROUP BY sr.phone_number
    ORDER BY c DESC, ls DESC
    LIMIT _limit
  ),
  domt AS (
    SELECT sr.phone_number, sr.scam_type, count(*) tc,
           row_number() OVER (PARTITION BY sr.phone_number ORDER BY count(*) DESC) rn
    FROM scam_reports sr
    WHERE sr.phone_number IN (SELECT phone_number FROM agg) AND sr.status='approved'
    GROUP BY sr.phone_number, sr.scam_type
  )
  SELECT a.phone_number, a.c, d.scam_type, a.ls
  FROM agg a
  JOIN domt d ON d.phone_number = a.phone_number AND d.rn = 1
  ORDER BY a.c DESC, a.ls DESC;
END;
$$;