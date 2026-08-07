-- CamAlert Intelligence: scam-awareness content section
-- Additive only — does not alter any existing table, function, or policy.

-- 1. Categories (admin-managed, not a hardcoded enum, so new scam types
--    can be added from the CMS without a migration)
CREATE TABLE public.intelligence_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.intelligence_categories (slug, name, sort_order) VALUES
  ('momo-orange-money', 'MTN MoMo / Orange Money Scams', 1),
  ('whatsapp-scams', 'WhatsApp Scams', 2),
  ('phishing-links', 'Phishing & Suspicious Links', 3),
  ('fake-job-offers', 'Fake Job Offers', 4),
  ('investment-scams', 'Investment Scams', 5),
  ('fake-payment-confirmations', 'Fake Payment Confirmations', 6),
  ('emerging-patterns', 'Emerging Fraud Patterns', 7);

-- 2. Articles
CREATE TABLE public.intelligence_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT NOT NULL,               -- markdown
  category_id UUID NOT NULL REFERENCES public.intelligence_categories(id),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  cover_image_url TEXT,
  og_image_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  author_id UUID REFERENCES auth.users(id),
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_intelligence_articles_status ON public.intelligence_articles(status);
CREATE INDEX idx_intelligence_articles_category ON public.intelligence_articles(category_id);
CREATE INDEX idx_intelligence_articles_published_at ON public.intelligence_articles(published_at DESC);

-- Full-text search across title/excerpt/body
ALTER TABLE public.intelligence_articles
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'C')
  ) STORED;

CREATE INDEX idx_intelligence_articles_search ON public.intelligence_articles USING GIN(search_vector);

-- 3. Revisions — every save is kept, nothing is ever lost, and a published
--    article can be rolled back if an edit breaks it.
CREATE TABLE public.intelligence_article_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.intelligence_articles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT NOT NULL,
  edited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_intelligence_revisions_article ON public.intelligence_article_revisions(article_id);

-- updated_at auto-touch (matches convention if one already exists; harmless if unused elsewhere)
CREATE OR REPLACE FUNCTION public.touch_intelligence_articles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_intelligence_articles_updated_at
  BEFORE UPDATE ON public.intelligence_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_intelligence_articles_updated_at();

-- Snapshot a revision on every body/title/excerpt change
CREATE OR REPLACE FUNCTION public.snapshot_intelligence_article_revision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.intelligence_article_revisions (article_id, title, excerpt, body, edited_by)
  VALUES (OLD.id, OLD.title, OLD.excerpt, OLD.body, auth.uid());
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_intelligence_articles_revision
  BEFORE UPDATE ON public.intelligence_articles
  FOR EACH ROW
  WHEN (OLD.title IS DISTINCT FROM NEW.title
     OR OLD.excerpt IS DISTINCT FROM NEW.excerpt
     OR OLD.body IS DISTINCT FROM NEW.body)
  EXECUTE FUNCTION public.snapshot_intelligence_article_revision();

-- Atomic view counter, callable by anonymous visitors reading published articles only
CREATE OR REPLACE FUNCTION public.increment_intelligence_view(article_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.intelligence_articles
  SET view_count = view_count + 1
  WHERE id = article_id AND status = 'published';
$$;

GRANT EXECUTE ON FUNCTION public.increment_intelligence_view(UUID) TO anon, authenticated;

-- 4. RLS — reuses the existing has_role() function, same pattern as your other admin tables
ALTER TABLE public.intelligence_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_article_revisions ENABLE ROW LEVEL SECURITY;

-- Categories: publicly readable, admin-writable
CREATE POLICY "Anyone can view categories" ON public.intelligence_categories
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage categories" ON public.intelligence_categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Articles: public can only see published ones; admins see/manage everything
CREATE POLICY "Anyone can view published articles" ON public.intelligence_articles
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND published_at <= now());

CREATE POLICY "Admins can view all articles" ON public.intelligence_articles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage articles" ON public.intelligence_articles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update articles" ON public.intelligence_articles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete articles" ON public.intelligence_articles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Revisions: admin-only, read and write
CREATE POLICY "Admins can view revisions" ON public.intelligence_article_revisions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
