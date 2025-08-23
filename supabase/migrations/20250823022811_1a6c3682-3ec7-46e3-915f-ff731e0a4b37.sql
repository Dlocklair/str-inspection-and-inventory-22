-- Fix the search path security issue for the function
DROP FUNCTION IF EXISTS public.get_current_user_profile();

CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(profile_id uuid, user_role text) AS $$
BEGIN
  RETURN QUERY
  SELECT profiles.id, profiles.role
  FROM public.profiles
  WHERE profiles.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;