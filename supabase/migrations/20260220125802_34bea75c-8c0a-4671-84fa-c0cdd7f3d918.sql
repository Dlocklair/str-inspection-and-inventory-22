
-- Add missing columns to damage_reports
ALTER TABLE public.damage_reports
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS severity text NOT NULL DEFAULT 'minor',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'reported',
  ADD COLUMN IF NOT EXISTS responsible_party text NOT NULL DEFAULT 'guest';

-- Create storage bucket for damage report photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('damage-report-photos', 'damage-report-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for damage-report-photos
CREATE POLICY "Authenticated users can view damage photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'damage-report-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Owners and managers can upload damage photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'damage-report-photos' 
  AND (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
);

CREATE POLICY "Owners and managers can update damage photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'damage-report-photos'
  AND (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
);

CREATE POLICY "Owners can delete damage photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'damage-report-photos'
  AND has_role(auth.uid(), 'owner'::app_role)
);

-- Add DELETE policy for damage_reports table (currently missing)
CREATE POLICY "Owners can delete damage reports"
ON public.damage_reports FOR DELETE
USING (has_role(auth.uid(), 'owner'::app_role));
