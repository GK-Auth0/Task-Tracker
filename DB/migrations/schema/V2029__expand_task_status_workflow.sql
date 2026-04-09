DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'tasks'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE tasks DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE tasks
  ALTER COLUMN status TYPE VARCHAR(30);

ALTER TABLE tasks
  ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('To Do', 'In Progress', 'Ready for QA', 'In QA', 'Blocked', 'Done'));
