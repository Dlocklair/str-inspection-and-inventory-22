-- Create a function to get user profiles with their auth emails
-- This allows us to fetch user emails from auth.users (which can't be queried directly from client)
CREATE OR REPLACE FUNCTION get_users_with_emails()
RETURNS TABLE (
  profile_id uuid,
  user_id uuid,
  full_name text,
  email text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as profile_id,
    p.user_id,
    p.full_name,
    au.email,
    p.created_at
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_users_with_emails() TO authenticated;