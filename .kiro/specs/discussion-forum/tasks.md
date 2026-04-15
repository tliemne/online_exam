# Implementation Plan: Discussion/Q&A Forum

## Overview

This implementation plan breaks down the Discussion/Q&A Forum feature into incremental, testable steps. The feature is completely isolated from existing exam/course logic and integrates only through foreign key relationships to existing tables (courses, users, notifications).

**Implementation Strategy:**
- Backend-first approach: Complete all backend infrastructure before frontend
- Incremental validation: Each major component includes checkpoint tasks
- Independent modules: Each service can be implemented and tested separately
- No modifications to existing code: All new functionality in new packages

## Tasks

- [x] 1. Set up database schema and core entities
  - Create database migration script for all discussion forum tables
  - Create DiscussionPost, DiscussionReply, DiscussionVote, DiscussionTag entities
  - Add proper indexes, foreign keys, and constraints as specified in design
  - Verify BaseEntity inheritance and timestamp management
  - _Requirements: 1.1, 2.1, 4.1, 5.1_

- [x] 2. Implement enums and DTOs
  - [x] 2.1 Create VoteType and PostStatus enums
    - Define VoteType enum (UPVOTE, DOWNVOTE)
    - Define PostStatus enum (ACTIVE, DELETED)
    - _Requirements: 4.1, 10.3_
  
  - [x] 2.2 Create request DTOs with validation annotations
    - Implement DiscussionPostRequest with @Size, @NotNull validations
    - Implement DiscussionReplyRequest with content validation
    - Implement DiscussionVoteRequest with VoteType
    - Implement DiscussionSearchRequest with optional filters
    - _Requirements: 1.5, 1.6, 2.5, 5.2, 5.3, 6.1-6.4_
  
  - [x] 2.3 Create response DTOs
    - Implement DiscussionPostResponse with all fields from design
    - Implement DiscussionReplyResponse with author info
    - Implement ForumStatsResponse with nested DTOs
    - Implement AuthorDTO for embedded author information
    - _Requirements: 8.2, 9.1, 12.1-12.5_

- [x] 3. Create repositories with custom query methods
  - [x] 3.1 Implement DiscussionPostRepository
    - Create basic JPA repository interface
    - Add custom query: findByCourseIdAndStatus with pagination
    - Add custom query: findByIdAndStatus for active posts only
    - Add custom query: countByCourseIdAndStatus
    - Add custom query: countByCourseIdAndHasBestAnswer
    - _Requirements: 8.1, 12.1, 12.3_
  
  - [x] 3.2 Implement DiscussionReplyRepository
    - Create basic JPA repository interface
    - Add custom query: findByPostIdAndIsDeletedFalse
    - Add custom query: findByPostIdOrderByVoteCountDesc
    - Add custom query: countByPostId
    - Add custom query: countByCourseId (join through post)
    - _Requirements: 9.2, 12.2_
  
  - [x] 3.3 Implement DiscussionVoteRepository
    - Create basic JPA repository interface
    - Add custom query: findByUserIdAndPostId
    - Add custom query: findByUserIdAndReplyId
    - Add unique constraint validation methods
    - _Requirements: 4.6, 9.4_
  
  - [x] 3.4 Implement DiscussionTagRepository
    - Create basic JPA repository interface
    - Add custom query: findByCourseIdAndNameIgnoreCase
    - Add custom query: findByCourseIdOrderByUsageCountDesc
    - _Requirements: 5.5, 5.6, 12.5_

- [x] 4. Implement mappers for entity-DTO conversion
  - [x] 4.1 Create DiscussionPostMapper with MapStruct
    - Map DiscussionPost entity to DiscussionPostResponse
    - Map DiscussionPostRequest to DiscussionPost entity
    - Include author mapping to AuthorDTO
    - Include tags collection mapping
    - Handle currentUserVote field (will be set by service)
    - _Requirements: 8.2, 9.1_
  
  - [x] 4.2 Create DiscussionReplyMapper with MapStruct
    - Map DiscussionReply entity to DiscussionReplyResponse
    - Map DiscussionReplyRequest to DiscussionReply entity
    - Include author mapping to AuthorDTO
    - Handle currentUserVote field (will be set by service)
    - _Requirements: 9.1_

- [ ] 5. Implement DiscussionPostService
  - [ ] 5.1 Implement createPost method
    - Validate user is course member using CourseService
    - Validate title length (10-200 chars)
    - Validate content length (20-10000 chars)
    - Initialize voteCount=0, replyCount=0, hasBestAnswer=false
    - Process tags: normalize to lowercase, create new tags if needed
    - Validate tag count (0-5) and tag name length (2-30 chars)
    - Save post and return DiscussionPostResponse
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 5.1, 5.2, 5.3, 5.5, 5.6_
  
  - [ ]* 5.2 Write unit tests for createPost
    - Test successful post creation with valid data
    - Test rejection when user is not course member
    - Test title length validation (too short, too long, valid)
    - Test content length validation (too short, too long, valid)
    - Test tag count validation (0, 5, 6 tags)
    - Test tag name length validation
    - Test tag normalization to lowercase
    - _Requirements: 1.1-1.6, 5.1-5.6_
  
  - [ ] 5.3 Implement getPostById method
    - Validate user is course member
    - Fetch post with all replies (non-deleted only)
    - Fetch current user's vote status for post and all replies
    - Order replies: best answer first, then by voteCount desc
    - Return DiscussionPostResponse with complete data
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ] 5.4 Implement getPostsByCourse method
    - Validate user is course member
    - Fetch posts with status=ACTIVE only
    - Apply pagination (10-50 items per page)
    - Default sort: createdAt descending
    - Include post summary fields (title, author, counts, status)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ] 5.5 Implement updatePost method
    - Validate user is post author OR course teacher
    - Validate post was created less than 24 hours ago
    - Validate new title and content lengths
    - Process new tags (replace old tags completely)
    - Update updatedAt timestamp
    - Return updated DiscussionPostResponse
    - _Requirements: 10.1, 10.2, 10.6, 10.7, 5.4_
  
  - [ ] 5.6 Implement deletePost method
    - Validate user is post author OR course teacher
    - Set post status to DELETED
    - Mark all replies as deleted (isDeleted=true)
    - Post should not appear in list queries
    - _Requirements: 10.3, 10.4, 10.5_
  
  - [ ] 5.7 Implement markBestAnswer method
    - Validate user is post author OR course teacher
    - Validate reply belongs to the post
    - Remove best answer flag from previous reply (if any)
    - Set isBestAnswer=true for new reply
    - Set post.hasBestAnswer=true
    - Trigger notification to reply author via NotificationService
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 7.4_

- [ ] 6. Checkpoint - Test DiscussionPostService
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement DiscussionReplyService
  - [ ] 7.1 Implement createReply method
    - Validate user is course member (through post's course)
    - Validate content length (10-5000 chars)
    - Initialize voteCount=0, isBestAnswer=false, isDeleted=false
    - Increment parent post's replyCount
    - Save reply and return DiscussionReplyResponse
    - Trigger notification to post author via NotificationService
    - Trigger notifications to all previous reply authors
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6, 7.1, 7.2_
  
  - [ ]* 7.2 Write unit tests for createReply
    - Test successful reply creation with valid data
    - Test rejection when user is not course member
    - Test content length validation (too short, too long, valid)
    - Test replyCount increment on parent post
    - Verify notification creation for post author
    - _Requirements: 2.1-2.6, 7.1, 7.2_
  
  - [ ] 7.3 Implement updateReply method
    - Validate user is reply author OR course teacher
    - Validate reply was created less than 24 hours ago
    - Validate new content length (10-5000 chars)
    - Update updatedAt timestamp
    - Return updated DiscussionReplyResponse
    - _Requirements: 11.1, 11.2, 11.6, 11.7_
  
  - [ ] 7.4 Implement deleteReply method
    - Validate user is reply author OR course teacher
    - Set isDeleted=true
    - If reply was best answer, set post.hasBestAnswer=false
    - Reply should not appear in post detail queries
    - _Requirements: 11.3, 11.4, 11.5_
  
  - [ ] 7.5 Implement getRepliesByPost method
    - Fetch all non-deleted replies for post
    - Fetch current user's vote status for each reply
    - Order: best answer first, then by voteCount desc
    - Return list of DiscussionReplyResponse
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 8. Implement DiscussionVoteService
  - [ ] 8.1 Implement votePost method
    - Validate user is course member
    - Check if user already voted on this post
    - If no previous vote: create new vote, update post.voteCount (+1 or -1)
    - If previous vote exists: update vote type, adjust post.voteCount accordingly
    - Handle vote changes: upvote→downvote (-2), downvote→upvote (+2)
    - Enforce one vote per user per post constraint
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.7_
  
  - [ ]* 8.2 Write property test for vote count changes
    - **Property 11: Vote Count Changes**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
    - Generate random initial voteCount V
    - Test: upvote → voteCount = V + 1
    - Test: downvote → voteCount = V - 1
    - Test: upvote→downvote → voteCount = V - 2
    - Test: downvote→upvote → voteCount = V + 2
    - Test: remove upvote → voteCount = V - 1
    - Test: remove downvote → voteCount = V + 1
  
  - [ ] 8.3 Implement voteReply method
    - Validate user is course member (through reply's post)
    - Check if user already voted on this reply
    - If no previous vote: create new vote, update reply.voteCount
    - If previous vote exists: update vote type, adjust reply.voteCount
    - Handle vote changes with same logic as votePost
    - Enforce one vote per user per reply constraint
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.7_
  
  - [ ] 8.4 Implement removeVoteFromPost method
    - Find user's vote on post
    - Adjust post.voteCount based on removed vote type
    - Delete vote record
    - _Requirements: 4.5_
  
  - [ ] 8.5 Implement removeVoteFromReply method
    - Find user's vote on reply
    - Adjust reply.voteCount based on removed vote type
    - Delete vote record
    - _Requirements: 4.5_

- [ ] 9. Implement DiscussionSearchService
  - [ ] 9.1 Implement searchPosts method with keyword filter
    - Validate user is course member
    - Build query: WHERE (title LIKE %keyword% OR content LIKE %keyword%)
    - Apply status=ACTIVE filter
    - Support pagination
    - _Requirements: 6.1, 6.7_
  
  - [ ] 9.2 Add tag filter support to searchPosts
    - Build query: JOIN discussion_post_tags WHERE tag.name IN (tags)
    - Combine with keyword filter using AND logic
    - Return posts with at least one matching tag
    - _Requirements: 6.2, 6.4_
  
  - [ ] 9.3 Add answered status filter to searchPosts
    - Add WHERE hasBestAnswer = ? condition
    - Combine with other filters using AND logic
    - _Requirements: 6.3, 6.4_
  
  - [ ] 9.4 Add sorting support to searchPosts
    - Support sortBy: "date" (createdAt), "votes" (voteCount), "replies" (replyCount)
    - Support sort direction: ascending, descending
    - Default: createdAt descending
    - _Requirements: 6.6, 8.4_
  
  - [ ]* 9.5 Write unit tests for search functionality
    - Test keyword search in title and content
    - Test tag filter with single and multiple tags
    - Test answered status filter (true/false)
    - Test combined filters (keyword + tags + status)
    - Test sorting by date, votes, replies
    - Test course membership authorization
    - _Requirements: 6.1-6.7_

- [ ] 10. Checkpoint - Test voting and search services
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement DiscussionStatsService
  - [ ] 11.1 Implement getCourseForumStats method
    - Validate user is course teacher
    - Count total posts: SELECT COUNT(*) WHERE course_id AND status=ACTIVE
    - Count total replies: SELECT COUNT(*) FROM replies JOIN posts WHERE course_id
    - Count answered posts: SELECT COUNT(*) WHERE course_id AND hasBestAnswer=true
    - _Requirements: 12.1, 12.2, 12.3, 12.6_
  
  - [ ] 11.2 Add most active students calculation
    - Query: SELECT author_id, COUNT(*) as postCount FROM posts GROUP BY author_id
    - Query: SELECT author_id, COUNT(*) as replyCount FROM replies GROUP BY author_id
    - Combine results: total = postCount + replyCount
    - Order by total descending
    - Return top N students with user details
    - _Requirements: 12.4_
  
  - [ ] 11.3 Add popular tags calculation
    - Query: SELECT tag_id, usageCount FROM tags WHERE course_id
    - Order by usageCount descending
    - Return tag names and counts
    - _Requirements: 12.5_
  
  - [ ]* 11.4 Write unit tests for statistics
    - Test total counts accuracy
    - Test active students ranking order
    - Test popular tags ranking order
    - Test teacher-only authorization
    - _Requirements: 12.1-12.6_

- [ ] 12. Implement DiscussionForumController
  - [ ] 12.1 Create POST /api/courses/{courseId}/discussions endpoint
    - Accept DiscussionPostRequest in request body
    - Validate request with @Valid annotation
    - Call DiscussionPostService.createPost
    - Return 201 Created with DiscussionPostResponse
    - Handle authorization errors (403 Forbidden)
    - Handle validation errors (400 Bad Request)
    - _Requirements: 1.1-1.6_
  
  - [ ] 12.2 Create GET /api/courses/{courseId}/discussions endpoint
    - Accept pagination parameters (page, size)
    - Validate size between 10-50
    - Call DiscussionPostService.getPostsByCourse
    - Return 200 OK with Page<DiscussionPostResponse>
    - _Requirements: 8.1-8.5_
  
  - [ ] 12.3 Create GET /api/discussions/{postId} endpoint
    - Call DiscussionPostService.getPostById
    - Return 200 OK with DiscussionPostResponse including all replies
    - Handle not found (404) and authorization errors (403)
    - _Requirements: 9.1-9.5_
  
  - [ ] 12.4 Create PUT /api/discussions/{postId} endpoint
    - Accept DiscussionPostRequest in request body
    - Validate request with @Valid annotation
    - Call DiscussionPostService.updatePost
    - Return 200 OK with updated DiscussionPostResponse
    - Handle authorization and validation errors
    - _Requirements: 10.1, 10.2, 10.6, 10.7_
  
  - [ ] 12.5 Create DELETE /api/discussions/{postId} endpoint
    - Call DiscussionPostService.deletePost
    - Return 204 No Content on success
    - Handle authorization errors (403)
    - _Requirements: 10.3-10.5_
  
  - [ ] 12.6 Create POST /api/discussions/{postId}/replies endpoint
    - Accept DiscussionReplyRequest in request body
    - Call DiscussionReplyService.createReply
    - Return 201 Created with DiscussionReplyResponse
    - Handle authorization and validation errors
    - _Requirements: 2.1-2.6_
  
  - [ ] 12.7 Create PUT /api/discussions/replies/{replyId} endpoint
    - Accept DiscussionReplyRequest in request body
    - Call DiscussionReplyService.updateReply
    - Return 200 OK with updated DiscussionReplyResponse
    - _Requirements: 11.1, 11.2, 11.6, 11.7_
  
  - [ ] 12.8 Create DELETE /api/discussions/replies/{replyId} endpoint
    - Call DiscussionReplyService.deleteReply
    - Return 204 No Content on success
    - _Requirements: 11.3-11.5_
  
  - [ ] 12.9 Create POST /api/discussions/{postId}/vote endpoint
    - Accept DiscussionVoteRequest with voteType
    - Call DiscussionVoteService.votePost
    - Return 200 OK
    - _Requirements: 4.1-4.7_
  
  - [ ] 12.10 Create DELETE /api/discussions/{postId}/vote endpoint
    - Call DiscussionVoteService.removeVoteFromPost
    - Return 204 No Content
    - _Requirements: 4.5_
  
  - [ ] 12.11 Create POST /api/discussions/replies/{replyId}/vote endpoint
    - Accept DiscussionVoteRequest with voteType
    - Call DiscussionVoteService.voteReply
    - Return 200 OK
    - _Requirements: 4.1-4.7_
  
  - [ ] 12.12 Create DELETE /api/discussions/replies/{replyId}/vote endpoint
    - Call DiscussionVoteService.removeVoteFromReply
    - Return 204 No Content
    - _Requirements: 4.5_
  
  - [ ] 12.13 Create POST /api/discussions/{postId}/best-answer/{replyId} endpoint
    - Call DiscussionPostService.markBestAnswer
    - Return 200 OK with updated DiscussionPostResponse
    - Handle authorization errors
    - _Requirements: 3.1-3.5_
  
  - [ ] 12.14 Create GET /api/courses/{courseId}/discussions/search endpoint
    - Accept DiscussionSearchRequest as query parameters
    - Accept pagination parameters
    - Call DiscussionSearchService.searchPosts
    - Return 200 OK with Page<DiscussionPostResponse>
    - _Requirements: 6.1-6.7_
  
  - [ ] 12.15 Create GET /api/courses/{courseId}/discussions/stats endpoint
    - Call DiscussionStatsService.getCourseForumStats
    - Return 200 OK with ForumStatsResponse
    - Handle teacher-only authorization
    - _Requirements: 12.1-12.6_

- [ ] 13. Checkpoint - Test all backend endpoints
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Implement frontend API service layer
  - [ ] 14.1 Add discussion forum API methods to services.js
    - Add createDiscussionPost(courseId, data)
    - Add getDiscussionPosts(courseId, page, size)
    - Add getDiscussionPostDetail(postId)
    - Add updateDiscussionPost(postId, data)
    - Add deleteDiscussionPost(postId)
    - Add createReply(postId, data)
    - Add updateReply(replyId, data)
    - Add deleteReply(replyId)
    - Add votePost(postId, voteType)
    - Add removeVoteFromPost(postId)
    - Add voteReply(replyId, voteType)
    - Add removeVoteFromReply(replyId)
    - Add markBestAnswer(postId, replyId)
    - Add searchDiscussionPosts(courseId, filters, page, size)
    - Add getForumStats(courseId)
    - _Requirements: All API endpoints_

- [ ] 15. Implement frontend discussion forum pages
  - [ ] 15.1 Create DiscussionForumPage component
    - Display list of discussion posts for a course
    - Show post title, author, vote count, reply count, best answer status
    - Implement pagination (10-50 items per page)
    - Add "Create Post" button (opens modal)
    - Add search/filter UI (keyword, tags, answered status)
    - Add sorting dropdown (date, votes, replies)
    - Navigate to post detail on click
    - _Requirements: 8.1-8.5, 6.1-6.7_
  
  - [ ] 15.2 Create CreatePostModal component
    - Form fields: title (10-200 chars), content (20-10000 chars)
    - Tag input with validation (0-5 tags, 2-30 chars each)
    - Client-side validation with error messages
    - Call createDiscussionPost API on submit
    - Show success/error toast notifications
    - Close modal and refresh list on success
    - _Requirements: 1.1-1.6, 5.1-5.6_
  
  - [ ] 15.3 Create DiscussionPostDetailPage component
    - Display full post: title, content, author, date, vote count, tags
    - Display all replies ordered by votes (best answer first)
    - Show upvote/downvote buttons for post and replies
    - Show "Mark as Best Answer" button (for post author and teachers)
    - Show "Edit" and "Delete" buttons (for authors and teachers)
    - Add "Reply" button (opens reply form)
    - Highlight best answer with special styling
    - _Requirements: 9.1-9.5, 3.1-3.5_
  
  - [ ] 15.4 Create ReplyForm component
    - Textarea for reply content (10-5000 chars)
    - Client-side validation
    - Call createReply API on submit
    - Show success/error toast notifications
    - Clear form and refresh replies on success
    - _Requirements: 2.1-2.6_
  
  - [ ] 15.5 Create VoteButton component
    - Display upvote/downvote buttons with current vote count
    - Highlight user's current vote (if any)
    - Call votePost or voteReply API on click
    - Handle vote changes (upvote→downvote, remove vote)
    - Update UI optimistically
    - _Requirements: 4.1-4.7_
  
  - [ ] 15.6 Create EditPostModal component
    - Pre-fill form with existing post data
    - Same validation as CreatePostModal
    - Call updateDiscussionPost API on submit
    - Show error if post is older than 24 hours
    - _Requirements: 10.1, 10.2, 10.6, 10.7_
  
  - [ ] 15.7 Create EditReplyModal component
    - Pre-fill form with existing reply content
    - Validate content length (10-5000 chars)
    - Call updateReply API on submit
    - Show error if reply is older than 24 hours
    - _Requirements: 11.1, 11.2, 11.6, 11.7_
  
  - [ ] 15.8 Create ForumStatsPage component (teachers only)
    - Display total posts, total replies, answered posts
    - Display most active students table (name, post count, reply count)
    - Display popular tags chart/list
    - Call getForumStats API on mount
    - Show "Access Denied" for non-teachers
    - _Requirements: 12.1-12.6_

- [ ] 16. Add i18n translations for discussion forum
  - [ ] 16.1 Add English translations to translation.json
    - Add keys for all UI labels, buttons, messages
    - Add validation error messages
    - Add success/error toast messages
    - _Requirements: All frontend components_
  
  - [ ] 16.2 Add Vietnamese translations to translation.json
    - Translate all English keys to Vietnamese
    - _Requirements: All frontend components_
  
  - [ ] 16.3 Add Chinese translations to translation.json
    - Translate all English keys to Chinese
    - _Requirements: All frontend components_

- [ ] 17. Integrate discussion forum into course navigation
  - [ ] 17.1 Add "Discussion Forum" tab to CourseDetailPage
    - Add new tab in course navigation (for students and teachers)
    - Route to DiscussionForumPage when tab is clicked
    - Show unread notification badge (if applicable)
    - _Requirements: 8.1-8.5_
  
  - [ ] 17.2 Add "Forum Stats" link to teacher course menu
    - Add link in teacher-only section
    - Route to ForumStatsPage when clicked
    - _Requirements: 12.1-12.6_

- [ ] 18. Final checkpoint - End-to-end testing
  - Test complete user flow: create post → reply → vote → mark best answer
  - Test authorization: non-members cannot access forum
  - Test edit time limit: posts/replies older than 24 hours cannot be edited
  - Test search and filtering with various combinations
  - Test pagination and sorting
  - Test teacher-only statistics page
  - Verify no impact on existing exam/course functionality
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Backend is completely independent - no modifications to existing code
- Frontend integrates through new tabs/pages only
- All new code is in `com.example.online_exam.discussion` package
- Database schema uses foreign keys to existing tables (courses, users)
