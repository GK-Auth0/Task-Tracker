-- Create pull_requests table
CREATE TABLE pull_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'merged', 'closed')),
    repository VARCHAR(255) NOT NULL,
    branch VARCHAR(255) NOT NULL,
    number INTEGER NOT NULL,
    author VARCHAR(255) NOT NULL,
    github_url VARCHAR(500) NOT NULL,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create commits table
CREATE TABLE commits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hash VARCHAR(40) NOT NULL,
    message TEXT NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    author_avatar VARCHAR(500),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_pull_requests_task_id ON pull_requests(task_id);
CREATE INDEX idx_commits_task_id ON commits(task_id);

-- Insert sample pull requests data
INSERT INTO pull_requests (title, status, repository, branch, number, author, github_url, task_id) 
SELECT 
    'Update brand color palette for marketing site',
    'open',
    'main-repo',
    'marketing-site',
    248,
    'alex.rivera',
    'https://github.com/company/main-repo/pull/248',
    t.id
FROM tasks t 
WHERE t.title LIKE '%Brand%' 
LIMIT 1;

INSERT INTO pull_requests (title, status, repository, branch, number, author, github_url, task_id) 
SELECT 
    'Add typography documentation to design system',
    'merged',
    'design-system',
    'docs',
    192,
    'sarah.m',
    'https://github.com/company/design-system/pull/192',
    t.id
FROM tasks t 
WHERE t.title LIKE '%Brand%' 
LIMIT 1;

-- Insert sample commits data
INSERT INTO commits (hash, message, author_name, author_avatar, task_id) 
SELECT 
    'a7c2e1f3b4d5c6e7f8a9b0c1d2e3f4g5h6i7j8k9',
    'Update primary blue hex code in tailwind config',
    'Alex R.',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    t.id
FROM tasks t 
WHERE t.title LIKE '%Brand%' 
LIMIT 1;

INSERT INTO commits (hash, message, author_name, author_avatar, task_id) 
SELECT 
    '8f4d9b2c3e4f5a6b7c8d9e0f1a2b3c4d5e6f7g8h',
    'Fix contrast ratio on branding buttons',
    'Alex R.',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    t.id
FROM tasks t 
WHERE t.title LIKE '%Brand%' 
LIMIT 1;

INSERT INTO commits (hash, message, author_name, author_avatar, task_id) 
SELECT 
    '3d2a5c9b4e6f7a8b9c0d1e2f3a4b5c6d7e8f9g0h',
    'Initial commit for brand refresh assets',
    'Sarah M.',
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
    t.id
FROM tasks t 
WHERE t.title LIKE '%Brand%' 
LIMIT 1;