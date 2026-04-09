CREATE TYPE cron_execution_status AS ENUM (
  'pending',
  'running',
  'success',
  'failed',
  'retrying'
);

ALTER TABLE cron_executions
ALTER COLUMN status TYPE cron_execution_status
USING status::text::cron_execution_status;

ALTER TABLE cron_executions
ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE cron_executions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE cron_retries
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
