-- Insert default general chat group
INSERT INTO chat_groups (id, name, description, created_by, is_project_group) 
SELECT 
    gen_random_uuid(),
    '#general',
    'General discussion for all team members',
    u.id,
    FALSE
FROM users u 
WHERE u.role = 'Admin' 
LIMIT 1
ON CONFLICT DO NOTHING;

-- Add all users to the general group
INSERT INTO chat_group_members (group_id, user_id)
SELECT 
    cg.id,
    u.id
FROM chat_groups cg
CROSS JOIN users u
WHERE cg.name = '#general'
ON CONFLICT (group_id, user_id) DO NOTHING;