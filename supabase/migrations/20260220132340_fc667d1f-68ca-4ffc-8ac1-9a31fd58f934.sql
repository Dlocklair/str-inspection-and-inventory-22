
-- Create inspection_assignments table to link templates to specific users
CREATE TABLE public.inspection_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.inspection_templates(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(template_id, assigned_to)
);

-- Enable RLS
ALTER TABLE public.inspection_assignments ENABLE ROW LEVEL SECURITY;

-- Owners can manage all assignments
CREATE POLICY "Owners can manage all assignments"
ON public.inspection_assignments
FOR ALL
USING (has_role(auth.uid(), 'owner'::app_role));

-- Managers can manage assignments for their properties
CREATE POLICY "Managers can view assignments for their properties"
ON public.inspection_assignments
FOR SELECT
USING (
  has_role(auth.uid(), 'manager'::app_role)
  AND EXISTS (
    SELECT 1 FROM inspection_templates it
    JOIN user_properties up ON up.property_id = it.property_id
    JOIN profiles p ON p.id = up.user_id
    WHERE it.id = inspection_assignments.template_id
    AND p.user_id = auth.uid()
  )
);

-- Managers can create assignments for their properties
CREATE POLICY "Managers can create assignments for their properties"
ON public.inspection_assignments
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'manager'::app_role)
  AND EXISTS (
    SELECT 1 FROM inspection_templates it
    JOIN user_properties up ON up.property_id = it.property_id
    JOIN profiles p ON p.id = up.user_id
    WHERE it.id = inspection_assignments.template_id
    AND p.user_id = auth.uid()
  )
);

-- Managers can delete assignments for their properties
CREATE POLICY "Managers can delete assignments for their properties"
ON public.inspection_assignments
FOR DELETE
USING (
  has_role(auth.uid(), 'manager'::app_role)
  AND EXISTS (
    SELECT 1 FROM inspection_templates it
    JOIN user_properties up ON up.property_id = it.property_id
    JOIN profiles p ON p.id = up.user_id
    WHERE it.id = inspection_assignments.template_id
    AND p.user_id = auth.uid()
  )
);

-- Users can view their own assignments
CREATE POLICY "Users can view own assignments"
ON public.inspection_assignments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.id = inspection_assignments.assigned_to
  )
);

-- Create index for performance
CREATE INDEX idx_inspection_assignments_template ON public.inspection_assignments(template_id);
CREATE INDEX idx_inspection_assignments_user ON public.inspection_assignments(assigned_to);

-- Create inspection-evidence storage bucket for per-item photos
INSERT INTO storage.buckets (id, name, public) VALUES ('inspection-evidence', 'inspection-evidence', true);

-- Storage RLS for inspection evidence
CREATE POLICY "Authenticated users can view inspection evidence"
ON storage.objects FOR SELECT
USING (bucket_id = 'inspection-evidence' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload inspection evidence"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'inspection-evidence' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own evidence"
ON storage.objects FOR UPDATE
USING (bucket_id = 'inspection-evidence' AND auth.role() = 'authenticated');

CREATE POLICY "Owners can delete inspection evidence"
ON storage.objects FOR DELETE
USING (bucket_id = 'inspection-evidence' AND has_role(auth.uid(), 'owner'::app_role));
