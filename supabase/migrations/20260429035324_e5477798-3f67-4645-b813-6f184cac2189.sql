-- Allow submitters to read back their own report (fixes "no rows returned" after insert with .select())
CREATE POLICY "Submitters can view their own reports"
ON public.scam_reports
FOR SELECT
TO authenticated
USING (submitter_id IS NOT NULL AND submitter_id = auth.uid());
