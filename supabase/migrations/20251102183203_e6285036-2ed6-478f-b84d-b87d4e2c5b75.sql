-- Update notification_method constraint to allow "both" option
ALTER TABLE public.inspection_types 
  DROP CONSTRAINT IF EXISTS inspection_types_notification_method_check;

ALTER TABLE public.inspection_types 
  ADD CONSTRAINT inspection_types_notification_method_check 
  CHECK (notification_method IN ('email', 'phone', 'both'));