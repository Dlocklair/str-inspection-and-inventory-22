-- Fix NULL property_id bypass vulnerability in RLS policies
-- Remove conditions that allow managers/inspectors to access records with NULL property_id

-- =====================================================
-- FIX: inspection_records - Manager SELECT policy
-- =====================================================
DROP POLICY IF EXISTS "Managers can view records for their properties" ON public.inspection_records;

CREATE POLICY "Managers can view records for their properties" 
ON public.inspection_records 
FOR SELECT 
USING (
  has_role(auth.uid(), 'manager'::app_role) AND 
  EXISTS (
    SELECT 1 FROM user_properties up
    JOIN profiles p ON p.id = up.user_id
    WHERE p.user_id = auth.uid() AND up.property_id = inspection_records.property_id
  )
);

-- =====================================================
-- FIX: inspection_records - Inspector SELECT policy
-- =====================================================
DROP POLICY IF EXISTS "Inspectors can view assigned property records" ON public.inspection_records;

CREATE POLICY "Inspectors can view assigned property records" 
ON public.inspection_records 
FOR SELECT 
USING (
  has_role(auth.uid(), 'inspector'::app_role) AND 
  EXISTS (
    SELECT 1 FROM user_properties up
    JOIN profiles p ON p.id = up.user_id
    WHERE p.user_id = auth.uid() AND up.property_id = inspection_records.property_id
  )
);

-- =====================================================
-- FIX: inspection_templates - Manager SELECT policy
-- =====================================================
DROP POLICY IF EXISTS "Managers can view templates for their properties" ON public.inspection_templates;

CREATE POLICY "Managers can view templates for their properties" 
ON public.inspection_templates 
FOR SELECT 
USING (
  has_role(auth.uid(), 'manager'::app_role) AND 
  EXISTS (
    SELECT 1 FROM user_properties up
    JOIN profiles p ON p.id = up.user_id
    WHERE p.user_id = auth.uid() AND up.property_id = inspection_templates.property_id
  )
);

-- =====================================================
-- FIX: inspection_templates - Inspector SELECT policy
-- =====================================================
DROP POLICY IF EXISTS "Inspectors can view assigned property templates" ON public.inspection_templates;

CREATE POLICY "Inspectors can view assigned property templates" 
ON public.inspection_templates 
FOR SELECT 
USING (
  has_role(auth.uid(), 'inspector'::app_role) AND 
  EXISTS (
    SELECT 1 FROM user_properties up
    JOIN profiles p ON p.id = up.user_id
    WHERE p.user_id = auth.uid() AND up.property_id = inspection_templates.property_id
  )
);

-- =====================================================
-- FIX: damage_reports - Manager SELECT policy
-- =====================================================
DROP POLICY IF EXISTS "Owners and managers can view damage reports" ON public.damage_reports;

CREATE POLICY "Owners and managers can view damage reports" 
ON public.damage_reports 
FOR SELECT 
USING (
  has_role(auth.uid(), 'owner'::app_role) OR 
  (
    has_role(auth.uid(), 'manager'::app_role) AND 
    EXISTS (
      SELECT 1 FROM user_properties up
      JOIN profiles p ON p.id = up.user_id
      WHERE p.user_id = auth.uid() AND up.property_id = damage_reports.property_id
    )
  )
);

-- =====================================================
-- FIX: inventory_items - Manager SELECT policy
-- =====================================================
DROP POLICY IF EXISTS "Owners and managers can view inventory items" ON public.inventory_items;

CREATE POLICY "Owners and managers can view inventory items" 
ON public.inventory_items 
FOR SELECT 
USING (
  has_role(auth.uid(), 'owner'::app_role) OR 
  (
    has_role(auth.uid(), 'manager'::app_role) AND 
    EXISTS (
      SELECT 1 FROM user_properties up
      JOIN profiles p ON p.id = up.user_id
      WHERE p.user_id = auth.uid() AND up.property_id = inventory_items.property_id
    )
  )
);