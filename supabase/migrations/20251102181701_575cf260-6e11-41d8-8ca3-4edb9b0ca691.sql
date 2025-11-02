-- Add frequency and notification columns to inspections table
ALTER TABLE public.inspections 
  ADD COLUMN frequency_type text CHECK (frequency_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually', 'custom')),
  ADD COLUMN frequency_days integer,
  ADD COLUMN next_due_date date,
  ADD COLUMN notifications_enabled boolean DEFAULT true,
  ADD COLUMN notification_method text CHECK (notification_method IN ('email', 'phone')) DEFAULT 'email',
  ADD COLUMN notification_days_ahead integer DEFAULT 7;

-- Create index on next_due_date for efficient querying
CREATE INDEX idx_inspections_next_due_date ON public.inspections(next_due_date) WHERE next_due_date IS NOT NULL;

COMMENT ON COLUMN public.inspections.frequency_type IS 'Type of frequency: daily, weekly, monthly, quarterly, annually, or custom';
COMMENT ON COLUMN public.inspections.frequency_days IS 'For custom frequency, number of days between inspections';
COMMENT ON COLUMN public.inspections.next_due_date IS 'Date when the next inspection of this type is due';
COMMENT ON COLUMN public.inspections.notifications_enabled IS 'Whether to send notifications for upcoming due dates';
COMMENT ON COLUMN public.inspections.notification_method IS 'How to notify: email or phone';
COMMENT ON COLUMN public.inspections.notification_days_ahead IS 'Number of days before due date to send notification';