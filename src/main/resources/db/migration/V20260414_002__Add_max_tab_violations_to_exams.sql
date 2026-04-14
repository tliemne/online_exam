-- Add max_tab_violations column to exams table
ALTER TABLE exams ADD COLUMN max_tab_violations INT DEFAULT 3;
