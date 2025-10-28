-- Fix RLS policies for inventory_categories
DROP POLICY IF EXISTS "Users can create inventory categories" ON inventory_categories;
DROP POLICY IF EXISTS "Users can update inventory categories" ON inventory_categories;
DROP POLICY IF EXISTS "Users can delete inventory categories" ON inventory_categories;

-- New policy: Allow authenticated users to create categories
CREATE POLICY "Authenticated users can create categories"
ON inventory_categories
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users with profiles to update categories
CREATE POLICY "Authenticated users can update categories"
ON inventory_categories
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Allow users with profiles to delete categories
CREATE POLICY "Authenticated users can delete categories"
ON inventory_categories
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Fix RLS policies for inventory_items
DROP POLICY IF EXISTS "Users can create inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Users can update inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Users can delete inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Authenticated users can view inventory items" ON inventory_items;

-- New policy: Allow authenticated users to create items
CREATE POLICY "Authenticated users can create items"
ON inventory_items
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update items
CREATE POLICY "Authenticated users can update items"
ON inventory_items
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete items
CREATE POLICY "Authenticated users can delete items"
ON inventory_items
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to view items
CREATE POLICY "Authenticated users can view items"
ON inventory_items
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Ensure the handle_new_user trigger exists and works correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'agent')
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill: Create profiles for any existing authenticated users without profiles
INSERT INTO public.profiles (user_id, full_name, role)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'User'),
  'agent'
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;