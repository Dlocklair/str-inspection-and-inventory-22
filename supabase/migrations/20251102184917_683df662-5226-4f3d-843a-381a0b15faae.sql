-- Move frequency and notification settings from inspection_types to inspections
-- Add columns to inspections table
ALTER TABLE public.inspections 
  ADD COLUMN IF NOT EXISTS frequency_type text,
  ADD COLUMN IF NOT EXISTS frequency_days integer,
  ADD COLUMN IF NOT EXISTS notifications_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_method text DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS notification_days_ahead integer DEFAULT 7;

-- Add constraint for frequency_type (per visit, monthly, quarterly, annually, custom)
ALTER TABLE public.inspections 
  DROP CONSTRAINT IF EXISTS inspections_frequency_type_check;

ALTER TABLE public.inspections 
  ADD CONSTRAINT inspections_frequency_type_check 
  CHECK (frequency_type IN ('per_visit', 'monthly', 'quarterly', 'annually', 'custom'));

-- Add constraint for notification_method
ALTER TABLE public.inspections 
  DROP CONSTRAINT IF EXISTS inspections_notification_method_check;

ALTER TABLE public.inspections 
  ADD CONSTRAINT inspections_notification_method_check 
  CHECK (notification_method IN ('email', 'phone', 'both'));

-- Remove columns from inspection_types table
ALTER TABLE public.inspection_types 
  DROP COLUMN IF EXISTS frequency_type,
  DROP COLUMN IF EXISTS frequency_days,
  DROP COLUMN IF EXISTS notifications_enabled,
  DROP COLUMN IF EXISTS notification_method,
  DROP COLUMN IF EXISTS notification_days_ahead;