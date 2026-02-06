-- Create environments table:
CREATE TABLE IF NOT EXISTS environments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    api_key UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_environments_project_id ON environments(project_id);
CREATE INDEX IF NOT EXISTS idx_environments_api_key ON environments(api_key);

-- Create error_groups table (for deduplication):
CREATE TABLE IF NOT EXISTS error_groups (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    environment_id INTEGER REFERENCES environments(id) ON DELETE CASCADE,
    fingerprint VARCHAR(64) NOT NULL,
    UNIQUE(project_id, environment_id, fingerprint),
    
    -- First occurrence details
    message TEXT NOT NULL,
    stack TEXT,
    url TEXT,
    source VARCHAR(50),
    level VARCHAR(50),
    
    -- Aggregated stats
    first_seen TIMESTAMPTZ NOT NULL,
    last_seen TIMESTAMPTZ NOT NULL,
    occurrence_count INTEGER DEFAULT 1,
    
    -- Status
    status VARCHAR(20) DEFAULT 'unresolved',
    resolved_at TIMESTAMPTZ,
    resolved_by INTEGER REFERENCES users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_groups_project_env ON error_groups(project_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_error_groups_fingerprint ON error_groups(fingerprint);
CREATE INDEX IF NOT EXISTS idx_error_groups_status ON error_groups(status);
CREATE INDEX IF NOT EXISTS idx_error_groups_last_seen ON error_groups(last_seen DESC);

-- Modify error_logs table - ADD new columns:
ALTER TABLE error_logs 
ADD COLUMN IF NOT EXISTS environment_id INTEGER REFERENCES environments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS error_group_id INTEGER REFERENCES error_groups(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_error_logs_environment_id ON error_logs(environment_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_group_id ON error_logs(error_group_id);

-- Migration for existing data:
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='api_key') THEN
        -- For each existing project, create default "production" environment
        INSERT INTO environments (project_id, name, api_key)
        SELECT id, 'production', api_key FROM projects
        ON CONFLICT (project_id, name) DO NOTHING;

        -- Create error groups from existing errors
        INSERT INTO error_groups (
            project_id, 
            environment_id, 
            fingerprint, 
            message, 
            stack, 
            url, 
            source, 
            level, 
            first_seen, 
            last_seen, 
            occurrence_count
        )
        SELECT 
            el.project_id,
            e.id as environment_id,
            MD5(el.message || COALESCE(SUBSTRING(el.stack, 1, 200), '')) as fingerprint,
            el.message,
            el.stack,
            el.url,
            el.source,
            el.level,
            MIN(el.created_at) as first_seen,
            MAX(el.created_at) as last_seen,
            COUNT(*) as occurrence_count
        FROM error_logs el
        JOIN environments e ON e.project_id = el.project_id AND e.name = 'production'
        WHERE el.environment_id IS NULL
        GROUP BY el.project_id, e.id, fingerprint, el.message, el.stack, el.url, el.source, el.level
        ON CONFLICT (project_id, environment_id, fingerprint) DO NOTHING;

        -- Link existing error_logs to environments and groups
        UPDATE error_logs el
        SET 
            environment_id = e.id,
            error_group_id = eg.id
        FROM 
            environments e,
            error_groups eg
        WHERE 
            el.environment_id IS NULL
            AND e.project_id = el.project_id 
            AND e.name = 'production'
            AND eg.fingerprint = MD5(el.message || COALESCE(SUBSTRING(el.stack, 1, 200), ''))
            AND eg.environment_id = e.id;

        -- Remove api_key column from projects table
        ALTER TABLE projects DROP COLUMN api_key;
    END IF;
END $$;
