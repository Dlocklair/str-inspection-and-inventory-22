-- Fix the search path security issue for the function (without dropping)
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(profile_id uuid, user_role text) 
LANGUAGE plpgsql
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT profiles.id, profiles.role
  FROM public.profiles
  WHERE profiles.user_id = auth.uid();
END;
$$;