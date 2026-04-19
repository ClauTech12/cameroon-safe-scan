CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  admin_exists boolean;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated'); END IF;
  SELECT EXISTS (SELECT 1 FROM user_roles WHERE role = 'admin') INTO admin_exists;
  IF admin_exists THEN RETURN jsonb_build_object('ok', false, 'error', 'admin_exists'); END IF;
  INSERT INTO user_roles (user_id, role) VALUES (uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  RETURN jsonb_build_object('ok', true);
END;
$$;