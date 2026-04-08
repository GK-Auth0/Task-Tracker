ALTER TABLE defects
  ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL;

ALTER TABLE test_cases
  ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL;

ALTER TABLE test_plans
  ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL;

ALTER TABLE test_runs
  ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_defects_sprint_id
  ON defects(sprint_id);

CREATE INDEX IF NOT EXISTS idx_test_cases_sprint_id
  ON test_cases(sprint_id);

CREATE INDEX IF NOT EXISTS idx_test_plans_sprint_id
  ON test_plans(sprint_id);

CREATE INDEX IF NOT EXISTS idx_test_runs_sprint_id
  ON test_runs(sprint_id);

UPDATE defects AS d
SET sprint_id = s.id
FROM sprints AS s
WHERE d.sprint_id IS NULL
  AND d.project_id = s.project_id
  AND LOWER(TRIM(COALESCE(d.sprint_name, ''))) = LOWER(TRIM(COALESCE(s.name, '')));

UPDATE test_cases AS tc
SET sprint_id = s.id
FROM sprints AS s
WHERE tc.sprint_id IS NULL
  AND tc.project_id = s.project_id
  AND LOWER(TRIM(COALESCE(tc.sprint_name, ''))) = LOWER(TRIM(COALESCE(s.name, '')));

UPDATE test_plans AS tp
SET sprint_id = s.id
FROM sprints AS s
WHERE tp.sprint_id IS NULL
  AND tp.project_id = s.project_id
  AND LOWER(TRIM(COALESCE(tp.sprint_name, ''))) = LOWER(TRIM(COALESCE(s.name, '')));

UPDATE test_runs AS tr
SET sprint_id = tp.sprint_id
FROM test_plans AS tp
WHERE tr.sprint_id IS NULL
  AND tr.plan_id = tp.id
  AND tp.sprint_id IS NOT NULL;
