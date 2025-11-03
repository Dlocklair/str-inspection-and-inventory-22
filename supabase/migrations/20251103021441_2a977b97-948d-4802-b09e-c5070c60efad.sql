-- Create user_properties table to track which users can access which properties
CREATE TABLE public.user_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  assigned_by uuid NOT NULL,
  assigned_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, property_id)
);

-- Enable RLS
ALTER TABLE public.user_properties ENABLE ROW LEVEL SECURITY;

-- Owners can manage property assignments
CREATE POLICY "Owners can manage property assignments"
  ON public.user_properties
  FOR ALL
  USING (has_role(auth.uid(), 'owner'));

-- Users can view their own property assignments
CREATE POLICY "Users can view their own property assignments"
  ON public.user_properties
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.id = user_properties.user_id
    )
  );

-- Update properties RLS to respect property assignments for non-owners
DROP POLICY IF EXISTS "Owners and managers can view properties" ON public.properties;

CREATE POLICY "Users can view their assigned properties"
  ON public.properties
  FOR SELECT
  USING (
    has_role(auth.uid(), 'owner') OR
    (
      (has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'inspector')) AND
      EXISTS (
        SELECT 1 FROM user_properties up
        JOIN profiles p ON p.id = up.user_id
        WHERE p.user_id = auth.uid()
        AND up.property_id = properties.id
      )
    )
  );