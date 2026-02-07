-- Add request and response context columns to error_logs
ALTER TABLE error_logs 
ADD COLUMN IF NOT EXISTS request_body TEXT,
ADD COLUMN IF NOT EXISTS request_headers JSONB,
ADD COLUMN IF NOT EXISTS response_body TEXT,
ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;
