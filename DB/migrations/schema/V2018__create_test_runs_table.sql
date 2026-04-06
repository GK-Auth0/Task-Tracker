CREATE TABLE IF NOT EXISTS test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  plan_id UUID NOT NULL REFERENCES test_plans(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  environment VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Planned'
    CHECK (status IN ('Planned', 'In Progress', 'Completed', 'Blocked')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_runs_plan_id
  ON test_runs(plan_id);

CREATE INDEX IF NOT EXISTS idx_test_runs_project_id
  ON test_runs(project_id);

CREATE INDEX IF NOT EXISTS idx_test_runs_owner_id
  ON test_runs(owner_id);

CREATE INDEX IF NOT EXISTS idx_test_runs_status
  ON test_runs(status);

DROP TRIGGER IF EXISTS update_test_runs_updated_at ON test_runs;
CREATE TRIGGER update_test_runs_updated_at
  BEFORE UPDATE ON test_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
