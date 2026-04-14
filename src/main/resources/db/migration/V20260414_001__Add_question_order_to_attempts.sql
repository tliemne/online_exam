-- Add question_order column to attempts table for storing randomized question order
ALTER TABLE attempts ADD COLUMN question_order TEXT;
