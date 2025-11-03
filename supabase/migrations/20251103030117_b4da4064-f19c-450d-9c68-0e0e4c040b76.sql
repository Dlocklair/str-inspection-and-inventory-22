-- Create junction table for template-property many-to-many relationship
CREATE TABLE public.inspection_template_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.inspection_types(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(template_id, property_id)
);

-- Enable RLS
ALTER TABLE public.inspection_template_properties ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inspection_template_properties
CREATE POLICY "Users can view template-property assignments"
  ON public.inspection_template_properties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id
      AND (
        has_role(auth.uid(), 'owner'::app_role) OR
        EXISTS (
          SELECT 1 FROM public.user_properties up
          JOIN public.profiles prof ON prof.id = up.user_id
          WHERE prof.user_id = auth.uid()
          AND up.property_id = p.id
        )
      )
    )
  );

CREATE POLICY "Owners and managers can manage template-property assignments"
  ON public.inspection_template_properties FOR ALL
  USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Add property_id to inventory_items
ALTER TABLE public.inventory_items 
  ADD COLUMN property_id uuid REFERENCES public.properties(id);

CREATE INDEX idx_inventory_items_property_id ON public.inventory_items(property_id);

-- Add proper property_id to damage_reports (keep property_name for now)
ALTER TABLE public.damage_reports 
  ADD COLUMN property_id uuid REFERENCES public.properties(id);

CREATE INDEX idx_damage_reports_property_id ON public.damage_reports(property_id);

-- Migrate existing inspection_types to junction table
INSERT INTO public.inspection_template_properties (template_id, property_id)
SELECT id, property_id 
FROM public.inspection_types 
WHERE property_id IS NOT NULL;

-- Update RLS for inventory_items to include property filtering
DROP POLICY IF EXISTS "Owners and managers can view inventory items" ON public.inventory_items;
CREATE POLICY "Owners and managers can view inventory items" 
  ON public.inventory_items FOR SELECT
  USING (
    has_role(auth.uid(), 'owner'::app_role) OR 
    (has_role(auth.uid(), 'manager'::app_role) AND (
      property_id IS NULL OR
      EXISTS (
        SELECT 1 FROM public.user_properties up
        JOIN public.profiles p ON p.id = up.user_id
        WHERE p.user_id = auth.uid() AND up.property_id = inventory_items.property_id
      )
    ))
  );

-- Update RLS for damage_reports to include property filtering
DROP POLICY IF EXISTS "Owners and managers can view damage reports" ON public.damage_reports;
CREATE POLICY "Owners and managers can view damage reports" 
  ON public.damage_reports FOR SELECT
  USING (
    has_role(auth.uid(), 'owner'::app_role) OR 
    (has_role(auth.uid(), 'manager'::app_role) AND (
      property_id IS NULL OR
      EXISTS (
        SELECT 1 FROM public.user_properties up
        JOIN public.profiles p ON p.id = up.user_id
        WHERE p.user_id = auth.uid() AND up.property_id = damage_reports.property_id
      )
    ))
  );