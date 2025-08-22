-- Create comprehensive RLS policies

-- Invitations policies (owners can manage)
CREATE POLICY "Owners can manage their invitations" ON public.invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'owner'
      AND profiles.id = invitations.owner_id
    )
  );

-- Agent permissions policies
CREATE POLICY "Users can view permissions involving them" ON public.agent_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND (profiles.id = agent_permissions.agent_id OR profiles.id = agent_permissions.owner_id)
    )
  );

CREATE POLICY "Owners can manage agent permissions" ON public.agent_permissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'owner'
      AND profiles.id = agent_permissions.owner_id
    )
  );

CREATE POLICY "Owners can update agent permissions" ON public.agent_permissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'owner'
      AND profiles.id = agent_permissions.owner_id
    )
  );

CREATE POLICY "Owners can delete agent permissions" ON public.agent_permissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'owner'
      AND profiles.id = agent_permissions.owner_id
    )
  );

-- Inspection types policies
CREATE POLICY "Users can view inspection types" ON public.inspection_types
  FOR SELECT USING (true);

CREATE POLICY "Users can create inspection types" ON public.inspection_types
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid()
    )
  );

-- Inspection items policies
CREATE POLICY "Users can view inspection items" ON public.inspection_items
  FOR SELECT USING (true);

CREATE POLICY "Users can create inspection items" ON public.inspection_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid()
    )
  );

-- Inspections policies
CREATE POLICY "Users can view relevant inspections" ON public.inspections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create inspections" ON public.inspections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = inspections.entered_by
    )
  );

CREATE POLICY "Users can update inspections" ON public.inspections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid()
    )
  );

-- Inspection results policies
CREATE POLICY "Users can view inspection results" ON public.inspection_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create inspection results" ON public.inspection_results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update inspection results" ON public.inspection_results
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid()
    )
  );

-- Inventory categories policies
CREATE POLICY "Users can view inventory categories" ON public.inventory_categories
  FOR SELECT USING (true);

CREATE POLICY "Users can create inventory categories" ON public.inventory_categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid()
    )
  );

-- Inventory items policies
CREATE POLICY "Users can view inventory items" ON public.inventory_items
  FOR SELECT USING (true);

CREATE POLICY "Users can create inventory items" ON public.inventory_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update inventory items" ON public.inventory_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid()
    )
  );

-- Inventory updates policies
CREATE POLICY "Users can view inventory updates" ON public.inventory_updates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create inventory updates" ON public.inventory_updates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = inventory_updates.updated_by
    )
  );

-- Damage reports policies
CREATE POLICY "Users can view damage reports" ON public.damage_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create damage reports" ON public.damage_reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = damage_reports.reported_by
    )
  );

CREATE POLICY "Users can update damage reports" ON public.damage_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid()
    )
  );

-- Notification settings policies
CREATE POLICY "Users can manage their notification settings" ON public.notification_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = notification_settings.user_id
    )
  );