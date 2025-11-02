-- Move frequency and notification settings from inspections to inspection_types
ALTER TABLE public.inspection_types
ADD COLUMN frequency_type text CHECK (frequency_type IN ('per_visit', 'monthly', 'quarterly', 'annually', 'custom')),
ADD COLUMN frequency_days integer,
ADD COLUMN notifications_enabled boolean DEFAULT true,
ADD COLUMN notification_method text DEFAULT 'email' CHECK (notification_method IN ('email', 'phone', 'both')),
ADD COLUMN notification_days_ahead integer DEFAULT 7;

-- Remove these columns from inspections table
ALTER TABLE public.inspections
DROP COLUMN IF EXISTS frequency_type,
DROP COLUMN IF EXISTS frequency_days,
DROP COLUMN IF EXISTS notifications_enabled,
DROP COLUMN IF EXISTS notification_method,
DROP COLUMN IF EXISTS notification_days_ahead;