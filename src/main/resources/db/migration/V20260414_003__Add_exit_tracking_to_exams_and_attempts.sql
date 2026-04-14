-- Add max_exit_attempts column to exams table
ALTER TABLE exams ADD COLUMN max_exit_attempts INT DEFAULT 1;

-- Add exit_count column to attempts table
ALTER TABLE attempts ADD COLUMN exit_count INT DEFAULT 0;
