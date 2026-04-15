-- ============================================================================
-- COMPLETE DATABASE SCHEMA - Online Exam System (SQL SERVER VERSION)
-- Includes: Existing tables + New Discussion Forum tables
-- Generated for database design review and optimization
-- ============================================================================

-- ============================================================================
-- CORE USER & AUTHENTICATION TABLES
-- ============================================================================

-- Table: users
CREATE TABLE users (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) UNIQUE,
    full_name NVARCHAR(255),
    avatar_url NVARCHAR(500),
    phone NVARCHAR(20),
    date_of_birth DATE,
    status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, BANNED
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);
CREATE INDEX idx_user_username ON users(username);
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_status ON users(status);

-- Table: roles
CREATE TABLE roles (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(50) NOT NULL UNIQUE, -- ADMIN, TEACHER, STUDENT
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Table: user_roles (many-to-many)
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Table: student_profiles
CREATE TABLE student_profiles (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    student_code NVARCHAR(50) UNIQUE,
    class_name NVARCHAR(100),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_student_code ON student_profiles(student_code);

-- Table: teacher_profiles
CREATE TABLE teacher_profiles (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    teacher_code NVARCHAR(50) UNIQUE,
    department NVARCHAR(100),
    specialization NVARCHAR(255),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_teacher_code ON teacher_profiles(teacher_code);

-- ============================================================================
-- COURSE MANAGEMENT TABLES
-- ============================================================================

-- Table: courses
CREATE TABLE courses (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    created_by BIGINT,
    teacher_id BIGINT, -- backward compatible, main teacher
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE NO ACTION
);
CREATE INDEX idx_course_created_by ON courses(created_by);
CREATE INDEX idx_course_teacher ON courses(teacher_id);

-- Table: course_teachers (many-to-many)
CREATE TABLE course_teachers (
    course_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    PRIMARY KEY (course_id, teacher_id),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table: course_students (many-to-many)
CREATE TABLE course_students (
    course_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    PRIMARY KEY (course_id, student_id),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table: lectures
CREATE TABLE lectures (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    course_id BIGINT NOT NULL,
    created_by BIGINT,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    video_url NVARCHAR(500),
    order_index INT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_lecture_course ON lectures(course_id);
CREATE INDEX idx_lecture_order ON lectures(course_id, order_index);

-- Table: course_announcements
CREATE TABLE course_announcements (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    course_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE NO ACTION
);
CREATE INDEX idx_ann_course ON course_announcements(course_id);
CREATE INDEX idx_ann_created ON course_announcements(created_at);

-- ============================================================================
-- QUESTION & TAG TABLES
-- ============================================================================

-- Table: tags
CREATE TABLE tags (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(255),
    color NVARCHAR(50) -- hex color for UI
);
CREATE INDEX idx_tag_name ON tags(name);

-- Table: questions
CREATE TABLE questions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    content NVARCHAR(MAX) NOT NULL,
    type NVARCHAR(50) NOT NULL, -- MULTIPLE_CHOICE, TRUE_FALSE, ESSAY
    difficulty NVARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- EASY, MEDIUM, HARD
    course_id BIGINT NOT NULL,
    created_by BIGINT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_question_course ON questions(course_id);
CREATE INDEX idx_question_type ON questions(type);
CREATE INDEX idx_question_difficulty ON questions(difficulty);
CREATE INDEX idx_question_course_type ON questions(course_id, type);

-- Table: answers
CREATE TABLE answers (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    content NVARCHAR(MAX) NOT NULL,
    correct BIT NOT NULL DEFAULT 0,
    question_id BIGINT NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);
CREATE INDEX idx_answer_question ON answers(question_id);
CREATE INDEX idx_answer_correct ON answers(question_id, correct);

-- Table: question_tags (many-to-many)
CREATE TABLE question_tags (
    question_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    PRIMARY KEY (question_id, tag_id),
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Table: question_statistics
CREATE TABLE question_statistics (
    question_id BIGINT PRIMARY KEY,
    total_attempts INT NOT NULL DEFAULT 0,
    correct_count INT NOT NULL DEFAULT 0,
    correct_rate FLOAT NOT NULL DEFAULT 0.0,
    difficulty_flag NVARCHAR(20) DEFAULT 'OK', -- TOO_EASY, TOO_HARD, OK
    last_updated DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- ============================================================================
-- EXAM & ATTEMPT TABLES
-- ============================================================================

-- Table: exams
CREATE TABLE exams (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    duration_minutes INT NOT NULL,
    start_time DATETIME2,
    end_time DATETIME2,
    total_score FLOAT DEFAULT 10.0,
    pass_score FLOAT DEFAULT 5.0,
    randomize_questions BIT DEFAULT 0,
    max_attempts INT DEFAULT 1,
    allow_resume BIT DEFAULT 0,
    max_tab_violations INT DEFAULT 3,
    max_exit_attempts INT DEFAULT 1,
    status NVARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, ARCHIVED
    course_id BIGINT NOT NULL,
    created_by BIGINT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_exam_course ON exams(course_id);
CREATE INDEX idx_exam_status ON exams(status);
CREATE INDEX idx_exam_created_by ON exams(created_by);

-- Table: exam_questions
CREATE TABLE exam_questions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    exam_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    score FLOAT NOT NULL DEFAULT 1.0,
    order_index INT NOT NULL DEFAULT 0,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE NO ACTION,
    CONSTRAINT uk_exam_question UNIQUE (exam_id, question_id)
);
CREATE INDEX idx_exam_questions_order ON exam_questions(exam_id, order_index);

-- Table: attempts
CREATE TABLE attempts (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    exam_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, SUBMITTED, GRADED
    score FLOAT,
    total_score FLOAT,
    passed BIT,
    started_at DATETIME2 DEFAULT GETDATE(),
    submitted_at DATETIME2,
    time_remaining_seconds INT,
    tab_violation_count INT DEFAULT 0,
    exit_count INT DEFAULT 0,
    question_order NVARCHAR(MAX), -- JSON array of question IDs
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE NO ACTION
);
CREATE INDEX idx_attempt_student ON attempts(student_id);
CREATE INDEX idx_attempt_exam ON attempts(exam_id);
CREATE INDEX idx_attempt_student_exam ON attempts(student_id, exam_id);
CREATE INDEX idx_attempt_status ON attempts(status);
CREATE INDEX idx_attempt_submitted_at ON attempts(submitted_at);

-- Table: attempt_answers
CREATE TABLE attempt_answers (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    attempt_id BIGINT NOT NULL,
    question_id BIGINT,
    selected_answer_id BIGINT,
    text_answer NVARCHAR(MAX),
    score FLOAT,
    is_correct BIT,
    teacher_comment NVARCHAR(MAX),
    FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE NO ACTION,
    FOREIGN KEY (selected_answer_id) REFERENCES answers(id) ON DELETE NO ACTION
);
CREATE INDEX idx_ans_attempt ON attempt_answers(attempt_id);
CREATE INDEX idx_ans_question ON attempt_answers(question_id);
CREATE INDEX idx_ans_correct ON attempt_answers(attempt_id, is_correct);

-- ============================================================================
-- NOTIFICATION & ACTIVITY LOG TABLES
-- ============================================================================

-- Table: notifications
CREATE TABLE notifications (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type NVARCHAR(32) NOT NULL, -- EXAM_PUBLISHED, ATTEMPT_GRADED, SYSTEM
    title NVARCHAR(255) NOT NULL,
    message NVARCHAR(MAX),
    link NVARCHAR(255),
    is_read BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_notif_user ON notifications(user_id);
CREATE INDEX idx_notif_read ON notifications(is_read);
CREATE INDEX idx_notif_created ON notifications(created_at);

-- Table: activity_logs
CREATE TABLE activity_logs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT,
    action NVARCHAR(64) NOT NULL, -- LOGIN, CREATE_EXAM, SUBMIT_ATTEMPT, etc.
    target_type NVARCHAR(64), -- EXAM, QUESTION, COURSE, USER, ATTEMPT
    target_id BIGINT,
    description NVARCHAR(MAX),
    ip_address NVARCHAR(64),
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_log_user ON activity_logs(user_id);
CREATE INDEX idx_log_action ON activity_logs(action);
CREATE INDEX idx_log_created ON activity_logs(created_at);

-- ============================================================================
-- NEW: DISCUSSION FORUM TABLES
-- ============================================================================

-- Table: discussion_posts
CREATE TABLE discussion_posts (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(200) NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    course_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, DELETED
    vote_count INT DEFAULT 0,
    reply_count INT DEFAULT 0,
    has_best_answer BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE NO ACTION
);
CREATE INDEX idx_post_course ON discussion_posts(course_id);
CREATE INDEX idx_post_author ON discussion_posts(author_id);
CREATE INDEX idx_post_status ON discussion_posts(status);
CREATE INDEX idx_post_created ON discussion_posts(created_at);
CREATE INDEX idx_post_votes ON discussion_posts(vote_count);
CREATE INDEX idx_post_course_status ON discussion_posts(course_id, status);

-- Table: discussion_replies
CREATE TABLE discussion_replies (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    content NVARCHAR(MAX) NOT NULL,
    post_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    vote_count INT DEFAULT 0,
    is_best_answer BIT DEFAULT 0,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (post_id) REFERENCES discussion_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE NO ACTION
);
CREATE INDEX idx_reply_post ON discussion_replies(post_id);
CREATE INDEX idx_reply_author ON discussion_replies(author_id);
CREATE INDEX idx_reply_created ON discussion_replies(created_at);
CREATE INDEX idx_reply_votes ON discussion_replies(vote_count);
CREATE INDEX idx_reply_best ON discussion_replies(is_best_answer);
CREATE INDEX idx_reply_post_deleted ON discussion_replies(post_id, is_deleted);

-- Table: discussion_votes
CREATE TABLE discussion_votes (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    post_id BIGINT,
    reply_id BIGINT,
    vote_type NVARCHAR(10) NOT NULL, -- UPVOTE, DOWNVOTE
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES discussion_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_id) REFERENCES discussion_replies(id) ON DELETE NO ACTION,
    CONSTRAINT uk_vote_user_post UNIQUE (user_id, post_id),
    CONSTRAINT uk_vote_user_reply UNIQUE (user_id, reply_id),
    CONSTRAINT chk_vote_target CHECK ((post_id IS NOT NULL AND reply_id IS NULL) OR (post_id IS NULL AND reply_id IS NOT NULL))
);
CREATE INDEX idx_vote_user ON discussion_votes(user_id);
CREATE INDEX idx_vote_post ON discussion_votes(post_id);
CREATE INDEX idx_vote_reply ON discussion_votes(reply_id);

-- Table: discussion_tags
CREATE TABLE discussion_tags (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(30) NOT NULL,
    course_id BIGINT NOT NULL,
    usage_count INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT uk_tag_course_name UNIQUE (course_id, name)
);
CREATE INDEX idx_tag_course ON discussion_tags(course_id);
CREATE INDEX idx_tag_name ON discussion_tags(name);

-- Table: discussion_post_tags (many-to-many)
CREATE TABLE discussion_post_tags (
    post_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    FOREIGN KEY (post_id) REFERENCES discussion_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES discussion_tags(id) ON DELETE NO ACTION
);

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Total Tables: 26
-- 
-- User & Authentication (5 tables):
--   1. users
--   2. roles
--   3. user_roles (join table)
--   4. student_profiles
--   5. teacher_profiles
--
-- Course Management (5 tables):
--   6. courses
--   7. course_teachers (join table)
--   8. course_students (join table)
--   9. lectures
--   10. course_announcements
--
-- Question & Tag (5 tables):
--   11. tags
--   12. questions
--   13. answers
--   14. question_tags (join table)
--   15. question_statistics
--
-- Exam & Attempt (4 tables):
--   16. exams
--   17. exam_questions
--   18. attempts
--   19. attempt_answers
--
-- System (2 tables):
--   20. notifications
--   21. activity_logs
--
-- Discussion Forum - NEW (5 tables):
--   22. discussion_posts
--   23. discussion_replies
--   24. discussion_votes
--   25. discussion_tags
--   26. discussion_post_tags (join table)
--
-- Key Integration Points:
--   - discussion_posts.course_id → courses.id
--   - discussion_posts.author_id → users.id
--   - discussion_replies.author_id → users.id
--   - discussion_votes.user_id → users.id
--   - discussion_tags.course_id → courses.id
--
-- Database Diagram Verification:
--   ✅ All 26 tables are present in the ERD
--   ✅ All foreign key relationships are correctly displayed
--   ✅ Join tables (many-to-many) are properly connected
-- ============================================================================
