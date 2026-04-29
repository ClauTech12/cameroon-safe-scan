-- Function: auto-promote a specific email to admin
CREATE OR REPLACE FUNCTION public.bootstrap_admin_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND lower(NEW.email) = 'clauvetmt19988@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on new auth user
DROP TRIGGER IF EXISTS on_auth_user_created_bootstrap_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_bootstrap_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.bootstrap_admin_email();

-- Trigger on email update too (in case user changes email)
DROP TRIGGER IF EXISTS on_auth_user_updated_bootstrap_admin ON auth.users;
CREATE TRIGGER on_auth_user_updated_bootstrap_admin
AFTER UPDATE OF email ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.bootstrap_admin_email();

-- Backfill: if the user already exists, grant admin now
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE lower(email) = 'clauvetmt19988@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;