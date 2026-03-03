-- Create chat_group_members table
CREATE TABLE IF NOT EXISTS chat_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_group_members_group_id ON chat_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_group_members_user_id ON chat_group_members(user_id);