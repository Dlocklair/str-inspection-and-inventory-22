-- Add notification_emails column to notification_settings for storing recipient email addresses
ALTER TABLE public.notification_settings
ADD COLUMN notification_emails text[] DEFAULT '{}'::text[];