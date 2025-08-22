-- Fix security vulnerability: Restrict inventory_items access to authenticated users only
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view inventory items" ON public.inventory_items;

-- Create a new secure policy that only allows authenticated users to view inventory
CREATE POLICY "Authenticated users can view inventory items" 
ON public.inventory_items 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1
  FROM profiles
  WHERE (profiles.user_id = auth.uid())
));