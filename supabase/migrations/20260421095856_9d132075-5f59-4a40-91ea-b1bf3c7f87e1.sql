-- 1) Default new reports to pending (moderation gate)
ALTER TABLE public.scam_reports
  ALTER COLUMN status SET DEFAULT 'pending'::report_status;

-- 2) Abuse reports table
CREATE TABLE IF NOT EXISTS public.abuse_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.scam_reports(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  reporter_contact TEXT,
  submitter_id UUID,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.abuse_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit abuse reports"
  ON public.abuse_reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(reason) BETWEEN 5 AND 1000
  );

CREATE POLICY "Admins read abuse reports"
  ON public.abuse_reports FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update abuse reports"
  ON public.abuse_reports FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete abuse reports"
  ON public.abuse_reports FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_abuse_reports_updated
  BEFORE UPDATE ON public.abuse_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_abuse_reports_report ON public.abuse_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_abuse_reports_resolved ON public.abuse_reports(resolved);