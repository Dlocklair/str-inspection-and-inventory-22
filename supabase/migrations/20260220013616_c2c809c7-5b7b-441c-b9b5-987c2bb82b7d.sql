
-- Create warranties table
CREATE TABLE public.warranties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  parent_warranty_id UUID REFERENCES public.warranties(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  description TEXT,
  vendor TEXT,
  manufacturer TEXT,
  manufacturer_contact TEXT,
  vendor_contact TEXT,
  purchased_from TEXT,
  cost NUMERIC,
  purchase_date DATE NOT NULL,
  warranty_duration_type TEXT NOT NULL DEFAULT '1_year',
  warranty_duration_custom_days INTEGER,
  warranty_expiration_date DATE NOT NULL,
  attachment_urls TEXT[] DEFAULT '{}'::TEXT[],
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;

-- Owners can do everything
CREATE POLICY "Owners can manage all warranties"
  ON public.warranties FOR ALL
  USING (has_role(auth.uid(), 'owner'::app_role));

-- Managers can view/create/update warranties for their assigned properties
CREATE POLICY "Managers can view warranties for their properties"
  ON public.warranties FOR SELECT
  USING (has_role(auth.uid(), 'manager'::app_role) AND (
    property_id IS NULL OR EXISTS (
      SELECT 1 FROM user_properties up JOIN profiles p ON p.id = up.user_id
      WHERE p.user_id = auth.uid() AND up.property_id = warranties.property_id
    )
  ));

CREATE POLICY "Managers can create warranties for their properties"
  ON public.warranties FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'manager'::app_role) AND EXISTS (
    SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.id = warranties.created_by
  ));

CREATE POLICY "Managers can update warranties for their properties"
  ON public.warranties FOR UPDATE
  USING (has_role(auth.uid(), 'manager'::app_role) AND (
    property_id IS NULL OR EXISTS (
      SELECT 1 FROM user_properties up JOIN profiles p ON p.id = up.user_id
      WHERE p.user_id = auth.uid() AND up.property_id = warranties.property_id
    )
  ));

-- Trigger for updated_at
CREATE TRIGGER update_warranties_updated_at
  BEFORE UPDATE ON public.warranties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for warranty attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('warranty-attachments', 'warranty-attachments', false);

CREATE POLICY "Authenticated users can upload warranty attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'warranty-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view warranty attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'warranty-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete warranty attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'warranty-attachments' AND auth.role() = 'authenticated');
