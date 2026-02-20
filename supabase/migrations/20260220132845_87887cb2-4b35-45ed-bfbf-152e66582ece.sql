
-- Add claim-related fields to damage_reports for Airbnb/VRBO claims
ALTER TABLE public.damage_reports
  ADD COLUMN IF NOT EXISTS guest_name text,
  ADD COLUMN IF NOT EXISTS reservation_id text,
  ADD COLUMN IF NOT EXISTS booking_platform text,
  ADD COLUMN IF NOT EXISTS check_in_date date,
  ADD COLUMN IF NOT EXISTS check_out_date date,
  ADD COLUMN IF NOT EXISTS date_damage_discovered date,
  ADD COLUMN IF NOT EXISTS before_photo_urls text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS receipt_urls text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS resolution_sought text,
  ADD COLUMN IF NOT EXISTS claim_status text DEFAULT 'not_filed',
  ADD COLUMN IF NOT EXISTS claim_reference_number text,
  ADD COLUMN IF NOT EXISTS claim_deadline date,
  ADD COLUMN IF NOT EXISTS claim_timeline_notes text;
