-- Make task description required and non-empty
UPDATE tasks
SET description = 'Task description pending.'
WHERE description IS NULL OR BTRIM(description) = '';

ALTER TABLE tasks
ALTER COLUMN description SET NOT NULL;

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_description_non_empty_check;

ALTER TABLE tasks
ADD CONSTRAINT tasks_description_non_empty_check
CHECK (BTRIM(description) <> '');
