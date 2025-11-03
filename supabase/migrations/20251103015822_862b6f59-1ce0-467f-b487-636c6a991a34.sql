-- Create properties table
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- RLS Policies for properties
CREATE POLICY "Owners and managers can view properties"
  ON public.properties FOR SELECT
  USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Owners and managers can create properties"
  ON public.properties FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Owners and managers can update properties"
  ON public.properties FOR UPDATE
  USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Owners can delete properties"
  ON public.properties FOR DELETE
  USING (has_role(auth.uid(), 'owner'));

-- Add property_id to inspections table
ALTER TABLE public.inspections 
  ADD COLUMN property_id uuid REFERENCES public.properties(id);

CREATE INDEX idx_inspections_property_id ON public.inspections(property_id);

-- Add property_id to inspection_types table
ALTER TABLE public.inspection_types 
  ADD COLUMN property_id uuid REFERENCES public.properties(id);

CREATE INDEX idx_inspection_types_property_id ON public.inspection_types(property_id);

-- Add sms_phone to profiles table
ALTER TABLE public.profiles
  ADD COLUMN sms_phone text;

-- Add trigger for properties updated_at
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();