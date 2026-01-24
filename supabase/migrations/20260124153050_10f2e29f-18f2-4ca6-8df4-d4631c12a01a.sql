-- Drop the old restrictive check constraint
ALTER TABLE public.invitations DROP CONSTRAINT IF EXISTS invitations_role_check;

-- Add a new check constraint that allows manager and inspector roles (not owner, as owner should not be invitable)
ALTER TABLE public.invitations ADD CONSTRAINT invitations_role_check 
  CHECK (role IN ('manager', 'inspector'));