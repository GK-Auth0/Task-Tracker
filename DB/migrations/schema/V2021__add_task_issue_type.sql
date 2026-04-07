ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS issue_type VARCHAR(20) NOT NULL DEFAULT 'Task';

ALTER TABLE tasks
  DROP CONSTRAINT IF EXISTS tasks_issue_type_check;

ALTER TABLE tasks
  ADD CONSTRAINT tasks_issue_type_check
  CHECK (issue_type IN ('Story', 'Task', 'Bug'));

CREATE INDEX IF NOT EXISTS idx_tasks_issue_type ON tasks(issue_type);
