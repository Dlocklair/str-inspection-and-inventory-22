-- Add missing fields to inventory_items table
ALTER TABLE public.inventory_items
ADD COLUMN IF NOT EXISTS unit text,
ADD COLUMN IF NOT EXISTS units_per_package numeric,
ADD COLUMN IF NOT EXISTS cost_per_package numeric,
ADD COLUMN IF NOT EXISTS restock_requested boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS notes text;

-- Ensure "Other" category exists as default
INSERT INTO public.inventory_categories (name, description, is_predefined, created_by)
VALUES ('Other', 'Default category for uncategorized items', true, NULL)
ON CONFLICT DO NOTHING;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_category_id ON public.inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_created_by ON public.inventory_items(created_by);