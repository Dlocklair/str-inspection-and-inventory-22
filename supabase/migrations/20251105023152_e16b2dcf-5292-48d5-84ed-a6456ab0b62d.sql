-- Create inspection_templates table
CREATE TABLE public.inspection_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_predefined BOOLEAN DEFAULT false,
  frequency_type TEXT,
  frequency_days INTEGER,
  notifications_enabled BOOLEAN DEFAULT true,
  notification_method TEXT DEFAULT 'email',
  notification_days_ahead INTEGER DEFAULT 7,
  next_occurrence DATE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inspection_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inspection_templates
CREATE POLICY "Owners can manage all templates"
  ON public.inspection_templates
  FOR ALL
  USING (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Managers can view templates for their properties"
  ON public.inspection_templates
  FOR SELECT
  USING (
    has_role(auth.uid(), 'manager'::app_role) AND (
      property_id IS NULL OR
      EXISTS (
        SELECT 1 FROM user_properties up
        JOIN profiles p ON p.id = up.user_id
        WHERE p.user_id = auth.uid() AND up.property_id = inspection_templates.property_id
      )
    )
  );

CREATE POLICY "Managers can create templates for their properties"
  ON public.inspection_templates
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'manager'::app_role) AND
    EXISTS (
      SELECT 1 FROM user_properties up
      JOIN profiles p ON p.id = up.user_id
      WHERE p.user_id = auth.uid() AND up.property_id = inspection_templates.property_id
    )
  );

CREATE POLICY "Managers can update templates for their properties"
  ON public.inspection_templates
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'manager'::app_role) AND
    EXISTS (
      SELECT 1 FROM user_properties up
      JOIN profiles p ON p.id = up.user_id
      WHERE p.user_id = auth.uid() AND up.property_id = inspection_templates.property_id
    )
  );

CREATE POLICY "Inspectors can view templates"
  ON public.inspection_templates
  FOR SELECT
  USING (has_role(auth.uid(), 'inspector'::app_role));

-- Create inspection_records table
CREATE TABLE public.inspection_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.inspection_templates(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_due_date DATE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  performed_by UUID REFERENCES public.profiles(id),
  entered_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inspection_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inspection_records
CREATE POLICY "Owners can manage all records"
  ON public.inspection_records
  FOR ALL
  USING (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Managers can view records for their properties"
  ON public.inspection_records
  FOR SELECT
  USING (
    has_role(auth.uid(), 'manager'::app_role) AND (
      property_id IS NULL OR
      EXISTS (
        SELECT 1 FROM user_properties up
        JOIN profiles p ON p.id = up.user_id
        WHERE p.user_id = auth.uid() AND up.property_id = inspection_records.property_id
      )
    )
  );

CREATE POLICY "Managers can create records for their properties"
  ON public.inspection_records
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'manager'::app_role) AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.id = inspection_records.entered_by
    )
  );

CREATE POLICY "Managers can update records for their properties"
  ON public.inspection_records
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'manager'::app_role) AND
    EXISTS (
      SELECT 1 FROM user_properties up
      JOIN profiles p ON p.id = up.user_id
      WHERE p.user_id = auth.uid() AND up.property_id = inspection_records.property_id
    )
  );

CREATE POLICY "Inspectors can create records"
  ON public.inspection_records
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'inspector'::app_role) AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.id = inspection_records.entered_by
    )
  );

CREATE POLICY "Inspectors can view records"
  ON public.inspection_records
  FOR SELECT
  USING (has_role(auth.uid(), 'inspector'::app_role));

CREATE POLICY "Inspectors can update their own records"
  ON public.inspection_records
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'inspector'::app_role) AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.id = inspection_records.entered_by
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_inspection_templates_updated_at
  BEFORE UPDATE ON public.inspection_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inspection_records_updated_at
  BEFORE UPDATE ON public.inspection_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();