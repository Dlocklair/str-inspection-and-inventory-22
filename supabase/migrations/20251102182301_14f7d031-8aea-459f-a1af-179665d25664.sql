-- Remove frequency and notification columns from inspections table
-- (These should be defined at the inspection_type level, not per inspection)
ALTER TABLE public.inspections 
  DROP COLUMN IF EXISTS frequency_type,
  DROP COLUMN IF EXISTS frequency_days,
  DROP COLUMN IF EXISTS notifications_enabled,
  DROP COLUMN IF EXISTS notification_method,
  DROP COLUMN IF EXISTS notification_days_ahead;

-- Add missing columns to inspection_types if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='inspection_types' AND column_name='frequency_type') THEN
    ALTER TABLE public.inspection_types 
      ADD COLUMN frequency_type text CHECK (frequency_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually', 'custom'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='inspection_types' AND column_name='notifications_enabled') THEN
    ALTER TABLE public.inspection_types 
      ADD COLUMN notifications_enabled boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='inspection_types' AND column_name='notification_method') THEN
    ALTER TABLE public.inspection_types 
      ADD COLUMN notification_method text CHECK (notification_method IN ('email', 'phone')) DEFAULT 'email';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='inspection_types' AND column_name='notification_days_ahead') THEN
    ALTER TABLE public.inspection_types 
      ADD COLUMN notification_days_ahead integer DEFAULT 7;
  END IF;
END $$;