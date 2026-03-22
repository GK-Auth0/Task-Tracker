CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,   -- who sent invite (admin only)
  invitee_email VARCHAR(255) NOT NULL, -- email of invited person
  invitee_id UUID REFERENCES users(id) ON DELETE SET NULL,            -- filled after signup

  invite_code VARCHAR(100) UNIQUE NOT NULL, -- referral code
  temporary_password VARCHAR(255), -- temporary password for first login

  status VARCHAR(50) DEFAULT 'pending', 
  -- pending | accepted | expired

  sent_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add password_reset_required column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_invited_user BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_invites_inviter_id ON invites(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invites_invitee_email ON invites(invitee_email);
CREATE INDEX IF NOT EXISTS idx_invites_invite_code ON invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_invites_status ON invites(status);