-- First, let's add necessary columns for proper message security and functionality
ALTER TABLE public."Messages" 
ADD COLUMN sender_id uuid,
ADD COLUMN recipient_id uuid,
ADD COLUMN message_type text DEFAULT 'general',
ADD COLUMN thread_id uuid;

-- Add indexes for better performance
CREATE INDEX idx_messages_sender_id ON public."Messages"(sender_id);
CREATE INDEX idx_messages_recipient_id ON public."Messages"(recipient_id);
CREATE INDEX idx_messages_thread_id ON public."Messages"(thread_id);

-- Enable Row Level Security
ALTER TABLE public."Messages" ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to get current user's profile
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(profile_id uuid, user_role text) AS $$
BEGIN
  RETURN QUERY
  SELECT profiles.id, profiles.role
  FROM public.profiles
  WHERE profiles.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Policy: Users can view messages where they are sender or recipient
CREATE POLICY "Users can view their own messages" 
ON public."Messages" 
FOR SELECT 
USING (
  sender_id IN (SELECT profile_id FROM public.get_current_user_profile())
  OR 
  recipient_id IN (SELECT profile_id FROM public.get_current_user_profile())
  OR
  -- Owners can see all messages from their agents
  EXISTS (
    SELECT 1 FROM public.get_current_user_profile() p
    WHERE p.user_role = 'owner'
    AND (
      sender_id IN (
        SELECT ap.agent_id FROM public.agent_permissions ap
        WHERE ap.owner_id = p.profile_id
      )
      OR recipient_id IN (
        SELECT ap.agent_id FROM public.agent_permissions ap  
        WHERE ap.owner_id = p.profile_id
      )
    )
  )
);

-- Policy: Users can insert messages they are sending
CREATE POLICY "Users can send messages" 
ON public."Messages" 
FOR INSERT 
WITH CHECK (
  sender_id IN (SELECT profile_id FROM public.get_current_user_profile())
  AND sender_id IS NOT NULL
  AND recipient_id IS NOT NULL
);

-- Policy: Users can update their own messages (for editing/status updates)
CREATE POLICY "Users can update their own messages" 
ON public."Messages" 
FOR UPDATE 
USING (
  sender_id IN (SELECT profile_id FROM public.get_current_user_profile())
);

-- Policy: Only owners can delete messages
CREATE POLICY "Owners can delete messages" 
ON public."Messages" 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.get_current_user_profile() p
    WHERE p.user_role = 'owner'
  )
);

-- Add updated_at column for tracking message updates
ALTER TABLE public."Messages" 
ADD COLUMN updated_at timestamp with time zone DEFAULT now();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public."Messages"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();