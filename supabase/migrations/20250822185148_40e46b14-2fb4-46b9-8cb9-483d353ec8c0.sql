-- Create RLS policies for all tables
CREATE POLICY "Owners can manage invitations" ON public.invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'owner'
      AND profiles.id = invitations.owner_id
    )
  );

CREATE POLICY "Users can view permissions involving them" ON public.agent_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND (profiles.id = agent_permissions.agent_id OR profiles.id = agent_permissions.owner_id)
    )
  );

CREATE POLICY "Owners can manage agent permissions" ON public.agent_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'owner'
      AND profiles.id = agent_permissions.owner_id
    )
  );

CREATE POLICY "Users can view inspection types" ON public.inspection_types
  FOR SELECT USING (true);

CREATE POLICY "Users can create inspection types" ON public.inspection_types
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = inspection_types.created_by
    )
  );

CREATE POLICY "Users can view inspection items" ON public.inspection_items
  FOR SELECT USING (true);

CREATE POLICY "Users can create inspection items" ON public.inspection_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = inspection_items.created_by
    )
  );

CREATE POLICY "Users can view relevant inspections" ON public.inspections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND (profiles.id = inspections.performed_by OR profiles.id = inspections.entered_by)
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

CREATE POLICY "Users can update inspections they're involved with" ON public.inspections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND (profiles.id = inspections.performed_by OR profiles.id = inspections.entered_by)
    )
  );

CREATE POLICY "Users can view inspection results" ON public.inspection_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.inspections 
      JOIN public.profiles ON (profiles.id = inspections.performed_by OR profiles.id = inspections.entered_by)
      WHERE profiles.user_id = auth.uid() 
      AND inspections.id = inspection_results.inspection_id
    )
  );

CREATE POLICY "Users can manage inventory categories" ON public.inventory_categories
  FOR ALL USING (true);

CREATE POLICY "Users can manage inventory items" ON public.inventory_items
  FOR ALL USING (true);

CREATE POLICY "Users can manage inventory updates" ON public.inventory_updates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage damage reports" ON public.damage_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their notification settings" ON public.notification_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = notification_settings.user_id
    )
  );