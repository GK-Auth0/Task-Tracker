-- Make project description required and non-empty
UPDATE projects
SET description = 'Project description pending.'
WHERE description IS NULL OR BTRIM(description) = '';

ALTER TABLE projects
ALTER COLUMN description SET NOT NULL;

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_description_non_empty_check;

ALTER TABLE projects
ADD CONSTRAINT projects_description_non_empty_check
CHECK (BTRIM(description) <> '');
