-- Update existing posts to set dislikeCount = 0 where it's NULL
UPDATE discussion_posts 
SET dislike_count = 0 
WHERE dislike_count IS NULL;

-- Update existing replies to set dislikeCount = 0 where it's NULL
UPDATE discussion_replies 
SET dislike_count = 0 
WHERE dislike_count IS NULL;
