CREATE TABLE IF NOT EXISTS auth_password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_password_resets_user_id
  ON auth_password_resets(user_id);

CREATE INDEX IF NOT EXISTS idx_auth_password_resets_token_hash
  ON auth_password_resets(token_hash);

CREATE INDEX IF NOT EXISTS idx_auth_password_resets_expires_at
  ON auth_password_resets(expires_at);
