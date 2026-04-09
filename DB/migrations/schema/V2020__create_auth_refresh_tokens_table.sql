CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  replaced_by_token_id UUID REFERENCES auth_refresh_tokens(id) ON DELETE SET NULL,
  created_by_ip VARCHAR(64),
  last_used_ip VARCHAR(64),
  last_used_at TIMESTAMP WITH TIME ZONE,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_user_id
  ON auth_refresh_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_expires_at
  ON auth_refresh_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_revoked_at
  ON auth_refresh_tokens(revoked_at);

DROP TRIGGER IF EXISTS update_auth_refresh_tokens_updated_at ON auth_refresh_tokens;
CREATE TRIGGER update_auth_refresh_tokens_updated_at
  BEFORE UPDATE ON auth_refresh_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
