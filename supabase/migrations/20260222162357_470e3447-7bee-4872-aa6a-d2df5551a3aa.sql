-- Allow inspectors with damage permission to view damage reports for their assigned properties
CREATE POLICY "Inspectors with damage permission can view reports"
ON public.damage_reports
FOR SELECT
USING (
  has_role(auth.uid(), 'inspector'::app_role)
  AND EXISTS (
    SELECT 1
    FROM profiles p
    JOIN agent_permissions ap ON ap.agent_id = p.id
    JOIN user_properties up ON up.user_id = p.id
    WHERE p.user_id = auth.uid()
      AND ap.damage = true
      AND up.property_id = damage_reports.property_id
  )
);

-- Allow inspectors with damage permission to create damage reports for their assigned properties
CREATE POLICY "Inspectors with damage permission can create reports"
ON public.damage_reports
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'inspector'::app_role)
  AND EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.user_id = auth.uid() AND p.id = damage_reports.reported_by
  )
  AND EXISTS (
    SELECT 1
    FROM profiles p
    JOIN agent_permissions ap ON ap.agent_id = p.id
    JOIN user_properties up ON up.user_id = p.id
    WHERE p.user_id = auth.uid()
      AND ap.damage = true
      AND up.property_id = damage_reports.property_id
  )
);