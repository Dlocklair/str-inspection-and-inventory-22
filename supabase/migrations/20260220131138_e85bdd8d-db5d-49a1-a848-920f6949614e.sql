
-- Add last_counted_at timestamp for tracking when items were last physically verified
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS last_counted_at timestamp with time zone DEFAULT NULL;

-- Add image_url for manually uploaded item photos
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;

-- Add barcode field for scanning
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS barcode text DEFAULT NULL;

-- Create storage bucket for inventory item photos
INSERT INTO storage.buckets (id, name, public) VALUES ('inventory-photos', 'inventory-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: anyone authenticated can view
CREATE POLICY "Authenticated users can view inventory photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'inventory-photos' AND auth.role() = 'authenticated');

-- Owners and managers can upload
CREATE POLICY "Owners and managers can upload inventory photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'inventory-photos' AND (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));

-- Owners and managers can update
CREATE POLICY "Owners and managers can update inventory photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'inventory-photos' AND (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));

-- Owners can delete
CREATE POLICY "Owners can delete inventory photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'inventory-photos' AND has_role(auth.uid(), 'owner'::app_role));
