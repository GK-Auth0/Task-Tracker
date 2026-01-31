-- User Metadata Table for IP Geolocation Data
-- Migration: V1008__create_user_metadata_table.sql

CREATE TABLE IF NOT EXISTS user_metadata (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    country VARCHAR(100),
    region VARCHAR(100),
    city VARCHAR(100),
    timezone VARCHAR(50),
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    browser VARCHAR(255),
    os VARCHAR(255),
    device VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_metadata_country ON user_metadata(country);
CREATE INDEX IF NOT EXISTS idx_user_metadata_created_at ON user_metadata(created_at);