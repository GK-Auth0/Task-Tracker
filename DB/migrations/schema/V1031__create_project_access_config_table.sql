CREATE TABLE IF NOT EXISTS config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  access_scope VARCHAR(30) NOT NULL DEFAULT 'specific_users'
    CHECK (access_scope IN ('specific_users', 'organization')),
  allowed_user_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_config_project_id
  ON config(project_id);

CREATE INDEX IF NOT EXISTS idx_config_organization_id
  ON config(organization_id);

CREATE INDEX IF NOT EXISTS idx_config_access_scope
  ON config(access_scope);

DROP TRIGGER IF EXISTS update_config_updated_at ON config;
CREATE TRIGGER update_config_updated_at
  BEFORE UPDATE ON config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
