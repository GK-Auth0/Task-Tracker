CREATE TABLE IF NOT EXISTS cron_types (
    type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_name VARCHAR(255) UNIQUE NOT NULL,
    description VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crons (
    cron_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cron_name VARCHAR(255) UNIQUE NOT NULL,
    type_id UUID NOT NULL REFERENCES cron_types(type_id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    schedule_expression VARCHAR(255) NOT NULL,
    next_run_at TIMESTAMP WITH TIME ZONE,
    last_run_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cron_executions (
    execution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cron_id UUID NOT NULL REFERENCES crons(cron_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL, -- SUCCESS / FAIL
    retry_count INT DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cron_retries (
    retry_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES cron_executions(execution_id) ON DELETE CASCADE,
    retry_count INT NOT NULL,
    status BOOLEAN NOT NULL,
    retry_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_active_next_run ON crons (is_active, next_run_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cron_name ON crons (cron_name);
CREATE INDEX IF NOT EXISTS idx_execution_cron_id ON cron_executions (cron_id);
