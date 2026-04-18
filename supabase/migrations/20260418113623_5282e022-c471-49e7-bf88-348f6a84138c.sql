-- Enum for scam types
CREATE TYPE public.scam_type AS ENUM (
  'mobile_money',
  'job',
  'phishing',
  'investment',
  'bank',
  'other'
);

CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.report_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Roles table (separate to prevent privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Reports table
CREATE TABLE public.scam_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_name TEXT,
  location TEXT NOT NULL,
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 5000),
  contact_info TEXT,
  screenshot_url TEXT,
  scam_type scam_type NOT NULL DEFAULT 'other',
  ai_confidence INTEGER CHECK (ai_confidence BETWEEN 0 AND 100),
  ai_advice TEXT[],
  risk_level risk_level NOT NULL DEFAULT 'medium',
  status report_status NOT NULL DEFAULT 'approved',
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en','fr')),
  submitter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scam_reports ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_reports_type ON public.scam_reports(scam_type);
CREATE INDEX idx_reports_created ON public.scam_reports(created_at DESC);
CREATE INDEX idx_reports_status ON public.scam_reports(status);

-- Anyone (incl. anonymous) can insert a report
CREATE POLICY "Anyone can submit reports" ON public.scam_reports
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Anyone can read approved reports
CREATE POLICY "Approved reports are public" ON public.scam_reports
  FOR SELECT TO anon, authenticated
  USING (status = 'approved');

-- Admins see everything
CREATE POLICY "Admins view all reports" ON public.scam_reports
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update reports" ON public.scam_reports
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete reports" ON public.scam_reports
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_scam_reports_updated_at
BEFORE UPDATE ON public.scam_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('screenshots', 'screenshots', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Screenshots are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'screenshots');

CREATE POLICY "Anyone can upload screenshots" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'screenshots');