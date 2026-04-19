CREATE OR REPLACE FUNCTION public.jsonb_object_keys_count(j jsonb)
RETURNS int LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE WHEN j IS NULL THEN 0 ELSE (SELECT count(*) FROM jsonb_object_keys(j))::int END
$$;