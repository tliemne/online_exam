-- ============================================================================
-- COMPLETE DATABASE SCHEMA - Online Exam System
-- Includes: Existing tables + New Discussion Forum tables
-- Generated for database design review and optimization
-- ============================================================================

-- ============================================================================
-- CORE USER & AUTHENTICATION TABLES
-- ============================================================================

-- Table: users
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255),
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    date_of_birth DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, BANNED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_username (username),
    INDEX idx_user_email (email),
    INDEX idx_user_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: roles
CREATE TABLE roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- ADMIN, TEACHER, STUDENT
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: user_roles (many-to-many)
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: student_profiles
CREATE TABLE student_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    student_code VARCHAR(50) UNIQUE,
    class_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_student_code (student_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: teacher_profiles
CREATE TABLE teacher_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    teacher_code VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    specialization VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_teacher_code (teacher_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- COURSE MANAGEMENT TABLES
-- ============================================================================

-- Table: courses
CREATE TABLE courses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by BIGINT,
    teacher_id BIGINT, -- backward compatible, main teacher
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_course_created_by (created_by),
    INDEX idx_course_teacher (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: course_teachers (many-to-many)
CREATE TABLE course_teachers (
    course_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    PRIMARY KEY (course_id, teacher_id),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: course_students (many-to-many)
CREATE TABLE course_students (
    course_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    PRIMARY KEY (course_id, student_id),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: lectures
CREATE TABLE lectures (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    created_by BIGINT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url VARCHAR(500),
    order_index INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_lecture_course (course_id),
    INDEX idx_lecture_order (course_id, order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: course_announcements
CREATE TABLE course_announcements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ann_course (course_id),
    INDEX idx_ann_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- QUESTION & TAG TABLES
-- ============================================================================

-- Table: tags
CREATE TABLE tags (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    color VARCHAR(50), -- hex color for UI
    INDEX idx_tag_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: questions
CREATE TABLE questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- MULTIPLE_CHOICE, TRUE_FALSE, ESSAY
    difficulty VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- EASY, MEDIUM, HARD
    course_id BIGINT NOT NULL,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_question_course (course_id),
    INDEX idx_question_type (type),
    INDEX idx_question_difficulty (difficulty),
    INDEX idx_question_course_type (course_id, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: answers
CREATE TABLE answers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    correct BOOLEAN NOT NULL DEFAULT FALSE,
    question_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_answer_question (question_id),
    INDEX idx_answer_correct (question_id, correct)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: question_tags (many-to-many)
CREATE TABLE question_tags (
    question_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    PRIMARY KEY (question_id, tag_id),
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: question_statistics
CREATE TABLE question_statistics (
    question_id BIGINT PRIMARY KEY,
    total_attempts INT NOT NULL DEFAULT 0,
    correct_count INT NOT NULL DEFAULT 0,
    correct_rate DOUBLE NOT NULL DEFAULT 0.0,
    difficulty_flag VARCHAR(20) DEFAULT 'OK', -- TOO_EASY, TOO_HARD, OK
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- EXAM & ATTEMPT TABLES
-- ============================================================================

-- Table: exams
CREATE TABLE exams (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    total_score DOUBLE DEFAULT 10.0,
    pass_score DOUBLE DEFAULT 5.0,
    randomize_questions BOOLEAN DEFAULT FALSE,
    max_attempts INT DEFAULT 1,
    allow_resume BOOLEAN DEFAULT FALSE,
    max_tab_violations INT DEFAULT 3,
    max_exit_attempts INT DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, ARCHIVED
    course_id BIGINT NOT NULL,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_exam_course (course_id),
    INDEX idx_exam_status (status),
    INDEX idx_exam_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: exam_questions
CREATE TABLE exam_questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    exam_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    score DOUBLE NOT NULL DEFAULT 1.0,
    order_index INT NOT NULL DEFAULT 0,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    UNIQUE KEY uk_exam_question (exam_id, question_id),
    INDEX idx_exam_questions_order (exam_id, order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: attempts
CREATE TABLE attempts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    exam_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, SUBMITTED, GRADED
    score DOUBLE,
    total_score DOUBLE,
    passed BOOLEAN,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    time_remaining_seconds INT,
    tab_violation_count INT DEFAULT 0,
    exit_count INT DEFAULT 0,
    question_order TEXT, -- JSON array of question IDs
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_attempt_student (student_id),
    INDEX idx_attempt_exam (exam_id),
    INDEX idx_attempt_student_exam (student_id, exam_id),
    INDEX idx_attempt_status (status),
    INDEX idx_attempt_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: attempt_answers
CREATE TABLE attempt_answers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    attempt_id BIGINT NOT NULL,
    question_id BIGINT,
    selected_answer_id BIGINT,
    text_answer TEXT,
    score DOUBLE,
    is_correct BOOLEAN,
    teacher_comment TEXT,
    FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE SET NULL,
    FOREIGN KEY (selected_answer_id) REFERENCES answers(id) ON DELETE SET NULL,
    INDEX idx_ans_attempt (attempt_id),
    INDEX idx_ans_question (question_id),
    INDEX idx_ans_correct (attempt_id, is_correct)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- NOTIFICATION & ACTIVITY LOG TABLES
-- ============================================================================

-- Table: notifications
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(32) NOT NULL, -- EXAM_PUBLISHED, ATTEMPT_GRADED, SYSTEM
    title VARCHAR(255) NOT NULL,
    message TEXT,
    link VARCHAR(255),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user (user_id),
    INDEX idx_notif_read (is_read),
    INDEX idx_notif_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: activity_logs
CREATE TABLE activity_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(64) NOT NULL, -- LOGIN, CREATE_EXAM, SUBMIT_ATTEMPT, etc.
    target_type VARCHAR(64), -- EXAM, QUESTION, COURSE, USER, ATTEMPT
    target_id BIGINT,
    description TEXT,
    ip_address VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_log_user (user_id),
    INDEX idx_log_action (action),
    INDEX idx_log_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- NEW: DISCUSSION FORUM TABLES
-- ============================================================================

-- Table: discussion_posts
CREATE TABLE discussion_posts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    course_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, DELETED
    vote_count INT DEFAULT 0,
    reply_count INT DEFAULT 0,
    has_best_answer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_post_course (course_id),
    INDEX idx_post_author (author_id),
    INDEX idx_post_status (status),
    INDEX idx_post_created (created_at),
    INDEX idx_post_votes (vote_count),
    INDEX idx_post_course_status (course_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: discussion_replies
CREATE TABLE discussion_replies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    post_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    vote_count INT DEFAULT 0,
    is_best_answer BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES discussion_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_reply_post (post_id),
    INDEX idx_reply_author (author_id),
    INDEX idx_reply_created (created_at),
    INDEX idx_reply_votes (vote_count),
    INDEX idx_reply_best (is_best_answer),
    INDEX idx_reply_post_deleted (post_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: discussion_votes
CREATE TABLE discussion_votes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    post_id BIGINT,
    reply_id BIGINT,
    vote_type VARCHAR(10) NOT NULL, -- UPVOTE, DOWNVOTE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES discussion_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_id) REFERENCES discussion_replies(id) ON DELETE CASCADE,
    UNIQUE KEY uk_vote_user_post (user_id, post_id),
    UNIQUE KEY uk_vote_user_reply (user_id, reply_id),
    INDEX idx_vote_user (user_id),
    INDEX idx_vote_post (post_id),
    INDEX idx_vote_reply (reply_id),
    CHECK ((post_id IS NOT NULL AND reply_id IS NULL) OR (post_id IS NULL AND reply_id IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: discussion_tags
CREATE TABLE discussion_tags (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) NOT NULL,
    course_id BIGINT NOT NULL,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY uk_tag_course_name (course_id, name),
    INDEX idx_tag_course (course_id),
    INDEX idx_tag_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: discussion_post_tags (many-to-many)
CREATE TABLE discussion_post_tags (
    post_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    FOREIGN KEY (post_id) REFERENCES discussion_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES discussion_tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Total Tables: 29
-- 
-- Existing Tables (24):
--   - users, roles, user_roles
--   - student_profiles, teacher_profiles
--   - courses, course_teachers, course_students
--   - lectures, course_announcements
--   - tags, questions, answers, question_tags, question_statistics
--   - exams, exam_questions
--   - attempts, attempt_answers
--   - notifications, activity_logs
--
-- New Discussion Forum Tables (5):
--   - discussion_posts
--   - discussion_replies
--   - discussion_votes
--   - discussion_tags
--   - discussion_post_tags
--
-- Key Integration Points:
--   - discussion_posts.course_id → courses.id
--   - discussion_posts.author_id → users.id
--   - discussion_replies.author_id → users.id
--   - discussion_votes.user_id → users.id
--   - discussion_tags.course_id → courses.id
-- ============================================================================
