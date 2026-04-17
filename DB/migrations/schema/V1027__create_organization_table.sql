CREATE SEQUENCE IF NOT EXISTS organization_code_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9999;

CREATE TABLE IF NOT EXISTS organization (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    org_code CHAR(6) NOT NULL UNIQUE DEFAULT ('TT' || LPAD(nextval('organization_code_seq')::text, 4, '0')),
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    logo_url VARCHAR(500),
    capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    industry VARCHAR(100),
    website_url VARCHAR(500),
    contact_email VARCHAR(255),
    phone_number VARCHAR(30),
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organization(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_organization_created_by ON organization(created_by);
CREATE INDEX IF NOT EXISTS idx_organization_slug ON organization(slug);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

DROP TRIGGER IF EXISTS update_organization_updated_at ON organization;
CREATE TRIGGER update_organization_updated_at
    BEFORE UPDATE ON organization
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
