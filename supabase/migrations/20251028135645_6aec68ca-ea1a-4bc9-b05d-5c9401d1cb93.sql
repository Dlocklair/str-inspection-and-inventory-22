-- Create role enum
CREATE TYPE public.app_role AS ENUM ('owner', 'manager', 'inspector');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to get all user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS TABLE(role app_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- Create function to check if any owners exist
CREATE OR REPLACE FUNCTION public.has_any_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'owner'::app_role
  )
$$;

-- RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Owners can view all roles"
ON user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can assign roles"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can remove roles"
ON user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "First user can claim owner"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (
  role = 'owner'::app_role 
  AND NOT public.has_any_owner()
  AND user_id = auth.uid()
);

-- Update RLS policies for inspections (all roles can access)
DROP POLICY IF EXISTS "Users can create inspections" ON inspections;
DROP POLICY IF EXISTS "Users can update inspections" ON inspections;
DROP POLICY IF EXISTS "Users can view relevant inspections" ON inspections;

CREATE POLICY "Authenticated users with roles can view inspections"
ON inspections FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::app_role) OR
  public.has_role(auth.uid(), 'manager'::app_role) OR
  public.has_role(auth.uid(), 'inspector'::app_role)
);

CREATE POLICY "Authenticated users with roles can create inspections"
ON inspections FOR INSERT
TO authenticated
WITH CHECK (
  (public.has_role(auth.uid(), 'owner'::app_role) OR
   public.has_role(auth.uid(), 'manager'::app_role) OR
   public.has_role(auth.uid(), 'inspector'::app_role)) AND
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND id = inspections.entered_by)
);

CREATE POLICY "Authenticated users with roles can update inspections"
ON inspections FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::app_role) OR
  public.has_role(auth.uid(), 'manager'::app_role) OR
  public.has_role(auth.uid(), 'inspector'::app_role)
);

-- Update RLS policies for inventory (owner and manager only)
DROP POLICY IF EXISTS "Authenticated users can view items" ON inventory_items;
DROP POLICY IF EXISTS "Authenticated users can create items" ON inventory_items;
DROP POLICY IF EXISTS "Authenticated users can update items" ON inventory_items;
DROP POLICY IF EXISTS "Authenticated users can delete items" ON inventory_items;

CREATE POLICY "Owners and managers can view inventory items"
ON inventory_items FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::app_role) OR
  public.has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Owners and managers can create inventory items"
ON inventory_items FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'owner'::app_role) OR
  public.has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Owners and managers can update inventory items"
ON inventory_items FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::app_role) OR
  public.has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Owners and managers can delete inventory items"
ON inventory_items FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::app_role) OR
  public.has_role(auth.uid(), 'manager'::app_role)
);

-- Update RLS policies for inventory_categories (owner and manager only)
DROP POLICY IF EXISTS "Users can view inventory categories" ON inventory_categories;
DROP POLICY IF EXISTS "Authenticated users can create categories" ON inventory_categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON inventory_categories;
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON inventory_categories;

CREATE POLICY "Owners and managers can view inventory categories"
ON inventory_categories FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::app_role) OR
  public.has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Owners and managers can create inventory categories"
ON inventory_categories FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'owner'::app_role) OR
  public.has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Owners and managers can update inventory categories"
ON inventory_categories FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::app_role) OR
  public.has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Owners and managers can delete inventory categories"
ON inventory_categories FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::app_role) OR
  public.has_role(auth.uid(), 'manager'::app_role)
);

-- Update RLS policies for damage_reports (owner and manager only)
DROP POLICY IF EXISTS "Users can create damage reports" ON damage_reports;
DROP POLICY IF EXISTS "Users can update damage reports" ON damage_reports;
DROP POLICY IF EXISTS "Users can view damage reports" ON damage_reports;

CREATE POLICY "Owners and managers can view damage reports"
ON damage_reports FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::app_role) OR
  public.has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Owners and managers can create damage reports"
ON damage_reports FOR INSERT
TO authenticated
WITH CHECK (
  (public.has_role(auth.uid(), 'owner'::app_role) OR
   public.has_role(auth.uid(), 'manager'::app_role)) AND
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND id = damage_reports.reported_by)
);

CREATE POLICY "Owners and managers can update damage reports"
ON damage_reports FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::app_role) OR
  public.has_role(auth.uid(), 'manager'::app_role)
);

-- Update handle_new_user to not set role (roles are in separate table now)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;