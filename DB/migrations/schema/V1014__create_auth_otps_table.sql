-- Migration: V1014__create_auth_otps_table.sql

CREATE TABLE IF NOT EXISTS auth_otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose VARCHAR(20) NOT NULL CHECK (purpose IN ('login', 'register', 'auth0', 'passwordReset')),
    otp_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_otps_user_id ON auth_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_otps_expires_at ON auth_otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_otps_is_verified ON auth_otps(is_verified);
