CREATE TABLE IF NOT EXISTS test_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sprint_name VARCHAR(120),
  release_name VARCHAR(120),
  status VARCHAR(20) NOT NULL DEFAULT 'Draft'
    CHECK (status IN ('Draft', 'Active', 'Completed')),
  suite_names JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_plans_project_id
  ON test_plans(project_id);

CREATE INDEX IF NOT EXISTS idx_test_plans_owner_id
  ON test_plans(owner_id);

CREATE INDEX IF NOT EXISTS idx_test_plans_status
  ON test_plans(status);

DROP TRIGGER IF EXISTS update_test_plans_updated_at ON test_plans;
CREATE TRIGGER update_test_plans_updated_at
  BEFORE UPDATE ON test_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
