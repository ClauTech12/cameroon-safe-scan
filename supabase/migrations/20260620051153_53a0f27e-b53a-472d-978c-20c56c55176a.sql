
-- Tighten EXECUTE on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.number_intel_summary(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.top_reported_numbers(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.report_explainability(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.phone_status(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.number_intel_summary(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.top_reported_numbers(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_explainability(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.phone_status(text) TO anon, authenticated;

-- Internal trigger / helper functions: not part of public API
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.extract_phone_from_contact() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.jsonb_object_keys_count(jsonb) FROM PUBLIC, anon, authenticated;

-- Remove broad listing policy on the public screenshots bucket.
-- Public URL access continues to work for public buckets even without a SELECT policy.
DROP POLICY IF EXISTS "Screenshots are publicly viewable" ON storage.objects;
