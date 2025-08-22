-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'agent')) DEFAULT 'agent',
  phone_numbers TEXT[] DEFAULT '{}',
  email_addresses TEXT[] DEFAULT '{}',
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'sms', 'both')) DEFAULT 'email',
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invitations table
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('agent')) DEFAULT 'agent',
  permissions JSONB NOT NULL DEFAULT '{"inspections": false, "inventory": false, "damage": false}',
  invitation_token UUID NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent permissions table
CREATE TABLE public.agent_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  inspections BOOLEAN DEFAULT false,
  inventory BOOLEAN DEFAULT false,
  damage BOOLEAN DEFAULT false,
  can_create_inspections BOOLEAN DEFAULT false,
  can_add_inspection_items BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id, owner_id)
);

-- Create inspection types table
CREATE TABLE public.inspection_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  frequency_days INTEGER, -- null for 'per_visit', 30 for monthly, 90 for quarterly, 365 for yearly
  is_custom BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inspection items table
CREATE TABLE public.inspection_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inspections table
CREATE TABLE public.inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_type_id UUID NOT NULL REFERENCES public.inspection_types(id),
  performed_by UUID REFERENCES public.profiles(id),
  entered_by UUID NOT NULL REFERENCES public.profiles(id),
  property_name TEXT,
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inspection results table
CREATE TABLE public.inspection_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  inspection_item_id UUID NOT NULL REFERENCES public.inspection_items(id),
  status TEXT CHECK (status IN ('pass', 'fail', 'needs_attention', 'not_applicable')) DEFAULT 'pass',
  notes TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory categories table
CREATE TABLE public.inventory_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_predefined BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory items table
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.inventory_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  current_quantity INTEGER DEFAULT 0,
  restock_threshold INTEGER DEFAULT 5,
  reorder_quantity INTEGER DEFAULT 10,
  unit_price DECIMAL(10,2),
  supplier TEXT,
  amazon_link TEXT,
  reorder_link TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory updates table
CREATE TABLE public.inventory_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  change_type TEXT CHECK (change_type IN ('restock', 'usage', 'adjustment', 'initial')) NOT NULL,
  notes TEXT,
  updated_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create damage reports table
CREATE TABLE public.damage_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_name TEXT,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_value DECIMAL(10,2),
  damage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  photo_urls TEXT[] DEFAULT '{}',
  work_order_issued BOOLEAN DEFAULT false,
  work_order_number TEXT,
  repair_completed BOOLEAN DEFAULT false,
  repair_cost DECIMAL(10,2),
  repair_date DATE,
  insurance_claim_filed BOOLEAN DEFAULT false,
  claim_number TEXT,
  notes TEXT,
  reported_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification settings table
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  inspection_reminders BOOLEAN DEFAULT true,
  overdue_inspections BOOLEAN DEFAULT true,
  overdue_delay_days INTEGER DEFAULT 15,
  inventory_alerts BOOLEAN DEFAULT true,
  damage_notifications BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.damage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for invitations (owners can manage)
CREATE POLICY "Owners can view their invitations" ON public.invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'owner'
      AND profiles.id = invitations.owner_id
    )
  );

-- Create RLS policies for agent permissions
CREATE POLICY "Users can view permissions involving them" ON public.agent_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND (profiles.id = agent_permissions.agent_id OR profiles.id = agent_permissions.owner_id)
    )
  );

CREATE POLICY "Owners can manage agent permissions" ON public.agent_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'owner'
      AND profiles.id = agent_permissions.owner_id
    )
  );

-- Create basic RLS policies for other tables (users can access data they're involved with)
CREATE POLICY "Users can view relevant inspection types" ON public.inspection_types
  FOR SELECT USING (true);

CREATE POLICY "Users can create inspection types" ON public.inspection_types
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = inspection_types.created_by
    )
  );

CREATE POLICY "Users can view inspection items" ON public.inspection_items
  FOR SELECT USING (true);

CREATE POLICY "Users can create inspection items" ON public.inspection_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = inspection_items.created_by
    )
  );

CREATE POLICY "Users can view relevant inspections" ON public.inspections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND (profiles.id = inspections.performed_by OR profiles.id = inspections.entered_by)
    )
  );

CREATE POLICY "Users can create inspections" ON public.inspections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = inspections.entered_by
    )
  );

CREATE POLICY "Users can update inspections they're involved with" ON public.inspections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND (profiles.id = inspections.performed_by OR profiles.id = inspections.entered_by)
    )
  );

-- Similar policies for other tables...
CREATE POLICY "Users can view inspection results" ON public.inspection_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.inspections 
      JOIN public.profiles ON (profiles.id = inspections.performed_by OR profiles.id = inspections.entered_by)
      WHERE profiles.user_id = auth.uid() 
      AND inspections.id = inspection_results.inspection_id
    )
  );

CREATE POLICY "Users can manage inventory categories" ON public.inventory_categories
  FOR ALL USING (true);

CREATE POLICY "Users can manage inventory items" ON public.inventory_items
  FOR ALL USING (true);

CREATE POLICY "Users can manage inventory updates" ON public.inventory_updates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage damage reports" ON public.damage_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their notification settings" ON public.notification_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = notification_settings.user_id
    )
  );

-- Insert default inspection types
INSERT INTO public.inspection_types (name, frequency_days, is_custom, created_by) VALUES
  ('Per Visit', NULL, false, (SELECT id FROM public.profiles WHERE role = 'owner' LIMIT 1)),
  ('Monthly', 30, false, (SELECT id FROM public.profiles WHERE role = 'owner' LIMIT 1)),
  ('Quarterly', 90, false, (SELECT id FROM public.profiles WHERE role = 'owner' LIMIT 1)),
  ('Yearly', 365, false, (SELECT id FROM public.profiles WHERE role = 'owner' LIMIT 1));

-- Insert predefined inventory categories with items
INSERT INTO public.inventory_categories (name, description, is_predefined) VALUES
  ('Toiletries', 'Bathroom and hygiene supplies', true),
  ('Linen', 'Towels, sheets, and fabric items', true),
  ('Consumables', 'Food, beverages, and disposable items', true),
  ('Batteries', 'Various battery types', true),
  ('Stock Items', 'Replacement items and supplies', true);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'agent')
  );
  
  -- Create default notification settings
  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_permissions_updated_at
  BEFORE UPDATE ON public.agent_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at
  BEFORE UPDATE ON public.inspections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_damage_reports_updated_at
  BEFORE UPDATE ON public.damage_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();