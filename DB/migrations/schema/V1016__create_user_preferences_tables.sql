CREATE TABLE IF NOT EXISTS user_pinned_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('task', 'project')),
    entity_id UUID NOT NULL,
    note VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS user_saved_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    page VARCHAR(20) NOT NULL CHECK (page IN ('tasks', 'projects')),
    name VARCHAR(100) NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_pinned_items_user_entity
ON user_pinned_items (user_id, entity_type);

CREATE INDEX IF NOT EXISTS idx_user_saved_views_user_page
ON user_saved_views (user_id, page);
