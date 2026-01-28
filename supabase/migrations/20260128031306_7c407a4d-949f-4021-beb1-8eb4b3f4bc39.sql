-- Fix get_users_with_emails function to restrict access to owners only
CREATE OR REPLACE FUNCTION public.get_users_with_emails()
 RETURNS TABLE(profile_id uuid, user_id uuid, full_name text, email text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow owners to call this function
  IF NOT has_role(auth.uid(), 'owner'::app_role) THEN
    RAISE EXCEPTION 'Access denied: owner role required';
  END IF;

  RETURN QUERY
  SELECT 
    p.id as profile_id,
    p.user_id,
    p.full_name,
    au.email::text,
    p.created_at
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.user_id
  ORDER BY p.created_at DESC;
END;
$function$;

-- Revoke execute from authenticated and grant only to authenticated users who pass the internal check
REVOKE EXECUTE ON FUNCTION public.get_users_with_emails() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_users_with_emails() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_with_emails() TO authenticated;