-- Add missing columns to subtasks table
-- Migration: V2027__add_missing_subtasks_columns.sql

-- Add assignee_id column to subtasks table
ALTER TABLE subtasks 
ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add linked_task_id column for task linking functionality
ALTER TABLE subtasks 
ADD COLUMN IF NOT EXISTS linked_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subtasks_assignee_id ON subtasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_linked_task_id ON subtasks(linked_task_id);