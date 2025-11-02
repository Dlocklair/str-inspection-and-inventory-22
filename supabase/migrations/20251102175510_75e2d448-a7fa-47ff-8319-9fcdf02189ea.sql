-- Create inspector_inspection_permissions table
CREATE TABLE IF NOT EXISTS public.inspector_inspection_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspector_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  inspection_type_id uuid NOT NULL REFERENCES public.inspection_types(id) ON DELETE CASCADE,
  granted_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (inspector_id, inspection_type_id)
);

-- Enable RLS on inspector_inspection_permissions
ALTER TABLE public.inspector_inspection_permissions ENABLE ROW LEVEL SECURITY;

-- Owners can manage inspector permissions
CREATE POLICY "Owners can manage inspector permissions"
  ON public.inspector_inspection_permissions
  FOR ALL
  USING (
    has_role(auth.uid(), 'owner')
  );

-- Inspectors can view their own permissions
CREATE POLICY "Inspectors can view their own permissions"
  ON public.inspector_inspection_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.id = inspector_inspection_permissions.inspector_id
    )
  );

-- Update inspections RLS policy to check inspector permissions
CREATE POLICY "Inspectors can view permitted inspections"
  ON public.inspections
  FOR SELECT
  USING (
    has_role(auth.uid(), 'inspector') 
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.inspector_inspection_permissions iip ON iip.inspector_id = p.id
      WHERE p.user_id = auth.uid()
        AND iip.inspection_type_id = inspections.inspection_type_id
    )
  );

-- Inspectors can create inspections for permitted types
CREATE POLICY "Inspectors can create permitted inspections"
  ON public.inspections
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'inspector')
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.inspector_inspection_permissions iip ON iip.inspector_id = p.id
      WHERE p.user_id = auth.uid()
        AND iip.inspection_type_id = inspections.inspection_type_id
        AND p.id = inspections.entered_by
    )
  );

-- Inspectors can update inspections for permitted types
CREATE POLICY "Inspectors can update permitted inspections"
  ON public.inspections
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'inspector')
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.inspector_inspection_permissions iip ON iip.inspector_id = p.id
      WHERE p.user_id = auth.uid()
        AND iip.inspection_type_id = inspections.inspection_type_id
    )
  );