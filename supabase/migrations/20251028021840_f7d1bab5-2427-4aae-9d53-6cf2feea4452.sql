-- Add UPDATE and DELETE policies for inventory_categories
CREATE POLICY "Users can update inventory categories"
ON public.inventory_categories
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete inventory categories"
ON public.inventory_categories
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
);

-- Add DELETE policy for inventory_items
CREATE POLICY "Users can delete inventory items"
ON public.inventory_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
);

-- Add foreign key with CASCADE delete if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'inventory_items_category_id_fkey'
  ) THEN
    ALTER TABLE public.inventory_items
    ADD CONSTRAINT inventory_items_category_id_fkey
    FOREIGN KEY (category_id)
    REFERENCES public.inventory_categories(id)
    ON DELETE CASCADE;
  END IF;
END $$;