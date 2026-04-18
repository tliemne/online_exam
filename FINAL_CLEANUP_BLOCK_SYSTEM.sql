-- FINAL CLEANUP: Remove block system from database
-- Run these commands in sequence

-- 1. Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- 2. Clear all data from user_block_history
TRUNCATE TABLE user_block_history;

-- 3. Reset any BANNED users back to ACTIVE
UPDATE users SET status = 'ACTIVE' WHERE status = 'BANNED';

-- 4. Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- 5. Verify cleanup
SELECT COUNT(*) as block_history_count FROM user_block_history;
SELECT COUNT(*) as banned_users_count FROM users WHERE status = 'BANNED';

-- Expected results: both should be 0
