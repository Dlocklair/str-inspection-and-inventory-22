-- Add fields for Amazon integration
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS asin text,
  ADD COLUMN IF NOT EXISTS amazon_image_url text,
  ADD COLUMN IF NOT EXISTS amazon_title text,
  ADD COLUMN IF NOT EXISTS amazon_last_refreshed timestamptz;

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_inventory_items_asin ON public.inventory_items (asin);