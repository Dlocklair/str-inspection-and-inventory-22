-- Fix storage bucket security for property-images
-- 1. First, drop existing overly permissive policies
DROP POLICY IF EXISTS "Public read access for property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view property images" ON storage.objects;
DROP POLICY IF EXISTS "Owners and managers can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Owners and managers can update property images" ON storage.objects;
DROP POLICY IF EXISTS "Owners and managers can delete property images" ON storage.objects;

-- 2. Create secure SELECT policy - allow viewing only for authorized users
CREATE POLICY "Authorized users can view property images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'property-images'
  AND (
    -- Owners can view all property images
    has_role(auth.uid(), 'owner'::app_role)
    OR
    -- Managers/inspectors can view images of their assigned properties
    EXISTS (
      SELECT 1 FROM user_properties up
      JOIN profiles p ON p.id = up.user_id
      WHERE p.user_id = auth.uid()
      AND up.property_id::text = (storage.foldername(name))[1]
    )
  )
);

-- 3. Create secure INSERT policy - only owners and managers can upload
CREATE POLICY "Owners and managers can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-images'
  AND (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
);

-- 4. Create secure UPDATE policy - only owners and managers can update
CREATE POLICY "Owners and managers can update property images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property-images'
  AND (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
);

-- 5. Create secure DELETE policy - only owners can delete
CREATE POLICY "Owners can delete property images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-images'
  AND has_role(auth.uid(), 'owner'::app_role)
);

-- 6. Update get_users_with_emails to filter only related users
CREATE OR REPLACE FUNCTION public.get_users_with_emails()
 RETURNS TABLE(profile_id uuid, user_id uuid, full_name text, email text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  owner_profile_id uuid;
BEGIN
  -- Only allow owners to call this function
  IF NOT has_role(auth.uid(), 'owner'::app_role) THEN
    RAISE EXCEPTION 'Access denied: owner role required';
  END IF;
  
  -- Get the owner's profile ID
  SELECT id INTO owner_profile_id FROM profiles WHERE profiles.user_id = auth.uid();

  RETURN QUERY
  SELECT 
    p.id as profile_id,
    p.user_id,
    p.full_name,
    au.email::text,
    p.created_at
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.user_id
  WHERE 
    -- Include the owner themselves
    p.user_id = auth.uid()
    OR
    -- Include agents directly assigned to this owner
    p.id IN (SELECT agent_id FROM agent_permissions WHERE owner_id = owner_profile_id)
    OR
    -- Include users who were invited by this owner
    p.invited_by = owner_profile_id
  ORDER BY p.created_at DESC;
END;
$function$;