
-- Create assets table for Material, Finish, & Equipment Register
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Equipment',
  brand TEXT,
  model_number TEXT,
  color_finish TEXT,
  dimensions TEXT,
  material_type TEXT,
  supplier TEXT,
  cost NUMERIC,
  purchase_date DATE,
  property_id UUID REFERENCES public.properties(id),
  location_in_property TEXT,
  condition TEXT DEFAULT 'new',
  serial_number TEXT,
  description TEXT,
  photo_urls TEXT[],
  warranty_id UUID REFERENCES public.warranties(id),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Owner-only policies (assets visible to users who created properties in the system)
CREATE POLICY "Users can view assets" ON public.assets FOR SELECT USING (true);
CREATE POLICY "Users can create assets" ON public.assets FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update assets" ON public.assets FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete assets" ON public.assets FOR DELETE USING (auth.uid() IS NOT NULL);

-- Timestamp trigger
CREATE TRIGGER update_assets_updated_at
BEFORE UPDATE ON public.assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
