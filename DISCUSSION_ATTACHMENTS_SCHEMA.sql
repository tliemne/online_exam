-- Discussion Attachments Table
-- Supports images, files, and other media types

CREATE TABLE discussion_attachments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT,
    reply_id BIGINT,
    
    -- File info
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'IMAGE', 'DOCUMENT', 'VIDEO', 'OTHER'
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    
    -- Foreign keys
    FOREIGN KEY (post_id) REFERENCES discussion_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_id) REFERENCES discussion_replies(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    -- Indexes
    INDEX idx_post (post_id),
    INDEX idx_reply (reply_id),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
