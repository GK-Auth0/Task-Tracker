CREATE TABLE IF NOT EXISTS test_case_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_test_case_modules_project_name UNIQUE (project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_test_case_modules_project_id
  ON test_case_modules(project_id);

CREATE INDEX IF NOT EXISTS idx_test_case_modules_owner_id
  ON test_case_modules(owner_id);

DROP TRIGGER IF EXISTS update_test_case_modules_updated_at ON test_case_modules;
CREATE TRIGGER update_test_case_modules_updated_at
  BEFORE UPDATE ON test_case_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
