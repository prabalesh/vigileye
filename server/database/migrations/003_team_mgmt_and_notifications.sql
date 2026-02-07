-- 1. Update project_members table - Add role column
ALTER TABLE project_members 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member'));

-- Set existing members as admin (backward compatibility)
UPDATE project_members SET role = 'admin' WHERE role IS NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members(role);

-- 3. Update error_logs table - Add request/response data
ALTER TABLE error_logs
ADD COLUMN IF NOT EXISTS request_body TEXT,
ADD COLUMN IF NOT EXISTS request_headers JSONB,
ADD COLUMN IF NOT EXISTS response_body TEXT,
ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;

CREATE INDEX IF NOT EXISTS idx_error_logs_response_time ON error_logs(response_time_ms) WHERE response_time_ms IS NOT NULL;

-- 4. Update error_groups table - Add notification tracking
ALTER TABLE error_groups
ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notification_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_error_groups_last_notified ON error_groups(last_notified_at);
