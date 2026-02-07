-- Add notification tracking fields to error_groups table

ALTER TABLE error_groups
ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS notification_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_error_groups_last_notified 
ON error_groups(last_notified_at) 
WHERE last_notified_at IS NOT NULL;

COMMENT ON COLUMN error_groups.last_notified_at IS 'Last time notification was sent for this error group';
COMMENT ON COLUMN error_groups.notification_count IS 'Total number of notifications sent for this error group';
