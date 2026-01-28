-- =============================================
-- FIX 1: Inspector SELECT policies - restrict to assigned properties
-- =============================================

-- Drop existing overly permissive inspector SELECT policies
DROP POLICY IF EXISTS "Inspectors can view templates" ON inspection_templates;
DROP POLICY IF EXISTS "Inspectors can view records" ON inspection_records;

-- Create properly scoped inspector SELECT policy for inspection_templates
-- Inspectors can only view templates for properties they're assigned to
CREATE POLICY "Inspectors can view assigned property templates"
ON inspection_templates FOR SELECT
USING (
  has_role(auth.uid(), 'inspector'::app_role) AND (
    property_id IS NULL OR
    EXISTS (
      SELECT 1 FROM user_properties up
      JOIN profiles p ON p.id = up.user_id
      WHERE p.user_id = auth.uid()
      AND up.property_id = inspection_templates.property_id
    )
  )
);

-- Create properly scoped inspector SELECT policy for inspection_records
-- Inspectors can only view records for properties they're assigned to
CREATE POLICY "Inspectors can view assigned property records"
ON inspection_records FOR SELECT
USING (
  has_role(auth.uid(), 'inspector'::app_role) AND (
    property_id IS NULL OR
    EXISTS (
      SELECT 1 FROM user_properties up
      JOIN profiles p ON p.id = up.user_id
      WHERE p.user_id = auth.uid()
      AND up.property_id = inspection_records.property_id
    )
  )
);

-- =============================================
-- FIX 2: Messages table RLS - migrate to has_role()
-- =============================================

-- Drop all existing Messages policies that use broken get_current_user_profile()
DROP POLICY IF EXISTS "Owners can delete messages" ON "Messages";
DROP POLICY IF EXISTS "Users can send messages" ON "Messages";
DROP POLICY IF EXISTS "Users can update their own messages" ON "Messages";
DROP POLICY IF EXISTS "Users can view their own messages" ON "Messages";

-- Create new Messages policies using has_role() function
-- SELECT: Users can view messages they sent or received, owners can view all
CREATE POLICY "Users can view their messages"
ON "Messages" FOR SELECT
USING (
  -- User is sender or recipient
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND (p.id = "Messages".sender_id OR p.id = "Messages".recipient_id)
  )
  OR
  -- Owner can view messages from their agents
  (
    has_role(auth.uid(), 'owner'::app_role) AND
    EXISTS (
      SELECT 1 FROM profiles owner_p
      WHERE owner_p.user_id = auth.uid()
      AND (
        "Messages".sender_id IN (
          SELECT ap.agent_id FROM agent_permissions ap WHERE ap.owner_id = owner_p.id
        )
        OR
        "Messages".recipient_id IN (
          SELECT ap.agent_id FROM agent_permissions ap WHERE ap.owner_id = owner_p.id
        )
      )
    )
  )
);

-- INSERT: Users can send messages (must be logged in with valid profile)
CREATE POLICY "Users can send messages"
ON "Messages" FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.id = "Messages".sender_id
  )
  AND sender_id IS NOT NULL
  AND recipient_id IS NOT NULL
);

-- UPDATE: Users can update their own sent messages
CREATE POLICY "Users can update own messages"
ON "Messages" FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.id = "Messages".sender_id
  )
);

-- DELETE: Only owners can delete messages
CREATE POLICY "Owners can delete messages"
ON "Messages" FOR DELETE
USING (
  has_role(auth.uid(), 'owner'::app_role)
);

-- =============================================
-- FIX 3: Cross-property INSERT policies for inspection_records
-- =============================================

-- Drop existing permissive INSERT policies
DROP POLICY IF EXISTS "Managers can create records for their properties" ON inspection_records;
DROP POLICY IF EXISTS "Inspectors can create records" ON inspection_records;

-- Create properly scoped manager INSERT policy
-- Managers can only create records for properties they're assigned to
CREATE POLICY "Managers can create records for assigned properties"
ON inspection_records FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'manager'::app_role) AND
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() AND p.id = inspection_records.entered_by
  ) AND
  (
    inspection_records.property_id IS NULL OR
    EXISTS (
      SELECT 1 FROM user_properties up
      JOIN profiles p ON p.id = up.user_id
      WHERE p.user_id = auth.uid() AND up.property_id = inspection_records.property_id
    )
  )
);

-- Create properly scoped inspector INSERT policy
-- Inspectors can only create records for properties they're assigned to
CREATE POLICY "Inspectors can create records for assigned properties"
ON inspection_records FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'inspector'::app_role) AND
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() AND p.id = inspection_records.entered_by
  ) AND
  (
    inspection_records.property_id IS NULL OR
    EXISTS (
      SELECT 1 FROM user_properties up
      JOIN profiles p ON p.id = up.user_id
      WHERE p.user_id = auth.uid() AND up.property_id = inspection_records.property_id
    )
  )
);