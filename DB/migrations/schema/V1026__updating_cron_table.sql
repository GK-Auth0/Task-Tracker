DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'cron_execution_status'
  ) THEN
    CREATE TYPE cron_execution_status AS ENUM (
      'pending',
      'running',
      'success',
      'failed',
      'retrying'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cron_executions'
      AND column_name = 'status'
      AND udt_name <> 'cron_execution_status'
  ) THEN
    ALTER TABLE cron_executions
    ALTER COLUMN status TYPE cron_execution_status
    USING status::text::cron_execution_status;
  END IF;
END $$;

ALTER TABLE cron_executions
ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE cron_executions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE cron_retries
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
