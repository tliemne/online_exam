package com.example.online_exam.discussion.service;

import com.example.online_exam.course.entity.Course;
import com.example.online_exam.course.repository.CourseRepository;
import com.example.online_exam.discussion.dto.DiscussionPostRequest;
import com.example.online_exam.discussion.dto.DiscussionPostResponse;
import com.example.online_exam.discussion.dto.DiscussionReplyResponse;
import com.example.online_exam.discussion.entity.DiscussionPost;
import com.example.online_exam.discussion.entity.DiscussionReply;
import com.example.online_exam.discussion.entity.DiscussionTag;
import com.example.online_exam.discussion.entity.DiscussionVote;
import com.example.online_exam.discussion.enums.PostStatus;
import com.example.online_exam.discussion.enums.VoteType;
import com.example.online_exam.discussion.mapper.DiscussionPostMapper;
import com.example.online_exam.discussion.mapper.DiscussionReplyMapper;
import com.example.online_exam.discussion.repository.DiscussionPostRepository;
import com.example.online_exam.discussion.repository.DiscussionReplyRepository;
import com.example.online_exam.discussion.repository.DiscussionTagRepository;
import com.example.online_exam.discussion.repository.DiscussionVoteRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.enums.RoleName;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DiscussionPostService {

    private final DiscussionPostRepository discussionPostRepository;
    private final DiscussionReplyRepository discussionReplyRepository;
    private final DiscussionVoteRepository discussionVoteRepository;
    private final DiscussionTagRepository discussionTagRepository;
    private final CourseRepository courseRepository;
    private final DiscussionPostMapper discussionPostMapper;
    private final DiscussionReplyMapper discussionReplyMapper;
    private final CurrentUserService currentUserService;
    private final com.example.online_exam.notification.service.NotificationService notificationService;
    private final com.example.online_exam.discussion.repository.DiscussionAttachmentRepository attachmentRepository;
    private final FileUploadService fileUploadService;

    /**
     * Task 5.1: Create a new discussion post
     */
    public DiscussionPostResponse createPost(DiscussionPostRequest request) {
        User currentUser = currentUserService.requireCurrentUser();
        
        // Validate user is course member
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        
        validateCourseMembership(currentUser, course);
        
        // Create post
        DiscussionPost post = new DiscussionPost();
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setCourse(course);
        post.setAuthor(currentUser);
        post.setStatus(PostStatus.ACTIVE);
        post.setVoteCount(0);
        post.setDislikeCount(0);
        post.setReplyCount(0);
        post.setHasBestAnswer(false);
        
        // Process tags
        if (request.getTags() != null && !request.getTags().isEmpty()) {
            for (String tagName : request.getTags()) {
                String normalizedName = tagName.toLowerCase().trim();
                DiscussionTag tag = discussionTagRepository
                        .findByCourseIdAndNameIgnoreCase(course.getId(), normalizedName)
                        .orElseGet(() -> {
                            DiscussionTag newTag = new DiscussionTag();
                            newTag.setName(normalizedName);
                            newTag.setCourse(course);
                            newTag.setUsageCount(0);
                            return discussionTagRepository.save(newTag);
                        });
                tag.setUsageCount(tag.getUsageCount() + 1);
                post.getTags().add(tag);
            }
        }
        
        discussionPostRepository.save(post);
        
        // Send notification to all students in course when teacher creates post
        if (currentUserService.hasRole(currentUser, RoleName.TEACHER)) {
            course.getStudents().forEach(student -> {
                if (!student.getId().equals(currentUser.getId())) {
                    // Determine route based on student role
                    String route = "/student/courses/" + course.getId() + "?tab=discussion";
                    notificationService.sendById(
                        student.getId(),
                        "DISCUSSION_NEW_POST",
                        "Bài viết mới từ giáo viên",
                        currentUser.getFullName() + " đã đăng bài viết mới: \"" + post.getTitle() + "\"",
                        route
                    );
                }
            });
        }
        
        return discussionPostMapper.toResponse(post);
    }

    /**
     * Task 5.3: Get post by ID with all replies
     */
    public DiscussionPostResponse getPostById(Long postId) {
        User currentUser = currentUserService.requireCurrentUser();
        
        DiscussionPost post = discussionPostRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Post not found"));
        
        // Validate user is course member
        validateCourseMembership(currentUser, post.getCourse());
        
        // Fix null dislikeCount for old posts
        if (post.getDislikeCount() == null) {
            post.setDislikeCount(0);
            discussionPostRepository.save(post);
        }
        
        // Map post to response
        DiscussionPostResponse response = discussionPostMapper.toResponse(post);
        
        // Fetch current user's vote on post
        discussionVoteRepository.findByUserIdAndPostId(currentUser.getId(), postId)
                .ifPresent(vote -> response.setCurrentUserVote(vote.getVoteType().name()));
        
        // Fetch non-deleted replies
        List<DiscussionReply> replies = discussionReplyRepository.findByPostIdAndIsDeletedFalse(postId);
        
        // Map replies and set current user votes
        List<DiscussionReplyResponse> replyResponses = replies.stream()
                .map(reply -> {
                    DiscussionReplyResponse replyResponse = discussionReplyMapper.toResponse(reply);
                    discussionVoteRepository.findByUserIdAndReplyId(currentUser.getId(), reply.getId())
                            .ifPresent(vote -> replyResponse.setCurrentUserVote(vote.getVoteType().name()));
                    return replyResponse;
                })
                .sorted(Comparator
                        .comparing(DiscussionReplyResponse::getIsBestAnswer, Comparator.reverseOrder())
                        .thenComparing(DiscussionReplyResponse::getVoteCount, Comparator.reverseOrder()))
                .collect(Collectors.toList());
        
        response.setReplies(replyResponses);
        
        return response;
    }

    /**
     * Task 5.4: Get posts by course with pagination
     */
    public Page<DiscussionPostResponse> getPostsByCourse(Long courseId, int page, int size) {
        User currentUser = currentUserService.requireCurrentUser();
        
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        
        validateCourseMembership(currentUser, course);
        
        // Validate pagination size
        if (size < 10 || size > 50) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Page size must be between 10 and 50");
        }
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<DiscussionPost> posts = discussionPostRepository.findByCourseIdAndStatus(courseId, PostStatus.ACTIVE, pageable);
        
        return posts.map(post -> {
            DiscussionPostResponse response = discussionPostMapper.toResponse(post);
            // Set current user vote
            discussionVoteRepository.findByUserIdAndPostId(currentUser.getId(), post.getId())
                    .ifPresent(vote -> response.setCurrentUserVote(vote.getVoteType().name()));
            return response;
        });
    }

    /**
     * Task 5.5: Update a post
     */
    public DiscussionPostResponse updatePost(Long postId, DiscussionPostRequest request) {
        User currentUser = currentUserService.requireCurrentUser();
        
        DiscussionPost post = discussionPostRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Post not found"));
        
        // Validate user is post author OR course teacher
        validatePostEditPermission(currentUser, post);
        
        // Validate post was created less than 24 hours ago
        if (post.getCreatedAt().isBefore(LocalDateTime.now().minusHours(24))) {
            throw new AppException(ErrorCode.FORBIDDEN, "Cannot edit post older than 24 hours");
        }
        
        // Update fields
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        
        // Replace tags completely
        post.getTags().clear();
        if (request.getTags() != null && !request.getTags().isEmpty()) {
            for (String tagName : request.getTags()) {
                String normalizedName = tagName.toLowerCase().trim();
                DiscussionTag tag = discussionTagRepository
                        .findByCourseIdAndNameIgnoreCase(post.getCourse().getId(), normalizedName)
                        .orElseGet(() -> {
                            DiscussionTag newTag = new DiscussionTag();
                            newTag.setName(normalizedName);
                            newTag.setCourse(post.getCourse());
                            newTag.setUsageCount(0);
                            return discussionTagRepository.save(newTag);
                        });
                tag.setUsageCount(tag.getUsageCount() + 1);
                post.getTags().add(tag);
            }
        }
        
        discussionPostRepository.save(post);
        
        return discussionPostMapper.toResponse(post);
    }

    /**
     * Task 5.6: Delete a post (hard delete with cascade)
     * Xóa thật bài viết và tất cả dữ liệu liên quan:
     * - Tất cả attachments (files và database records)
     * - Tất cả replies (và nested replies) và attachments của chúng
     * - Tất cả votes (cho post và replies)
     * - Notifications liên quan sẽ được xử lý khi click
     */
    public void deletePost(Long postId) {
        User currentUser = currentUserService.requireCurrentUser();
        
        DiscussionPost post = discussionPostRepository.findById(postId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Post not found"));
        
        // Validate user is post author OR course teacher OR admin
        validatePostEditPermission(currentUser, post);
        
        // 1. Get all replies (including nested)
        List<DiscussionReply> replies = discussionReplyRepository.findByPostIdAndIsDeletedFalse(postId);
        
        // 2. Delete all reply attachments (files + database)
        for (DiscussionReply reply : replies) {
            List<com.example.online_exam.discussion.entity.DiscussionAttachment> replyAttachments = 
                attachmentRepository.findByReplyIdOrderByCreatedAtAsc(reply.getId());
            for (com.example.online_exam.discussion.entity.DiscussionAttachment attachment : replyAttachments) {
                fileUploadService.deleteFile(attachment.getFilePath());
            }
            attachmentRepository.deleteAll(replyAttachments);
        }
        
        // 3. Delete all votes for replies
        for (DiscussionReply reply : replies) {
            discussionVoteRepository.deleteByReplyId(reply.getId());
        }
        
        // 4. Delete all replies
        discussionReplyRepository.deleteAll(replies);
        
        // 5. Delete all post attachments (files + database)
        List<com.example.online_exam.discussion.entity.DiscussionAttachment> postAttachments = 
            attachmentRepository.findByPostIdOrderByCreatedAtAsc(postId);
        for (com.example.online_exam.discussion.entity.DiscussionAttachment attachment : postAttachments) {
            fileUploadService.deleteFile(attachment.getFilePath());
        }
        attachmentRepository.deleteAll(postAttachments);
        
        // 6. Delete all votes for post
        discussionVoteRepository.deleteByPostId(postId);
        
        // 7. Delete post
        discussionPostRepository.delete(post);
        
        // Note: Notifications sẽ được xử lý khi user click vào
        // Nếu post không tồn tại, sẽ hiển thị "Bài viết không còn tồn tại"
    }

    /**
     * Task 5.7: Mark a reply as best answer
     */
    public DiscussionPostResponse markBestAnswer(Long postId, Long replyId) {
        User currentUser = currentUserService.requireCurrentUser();
        
        DiscussionPost post = discussionPostRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Post not found"));
        
        DiscussionReply reply = discussionReplyRepository.findById(replyId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Reply not found"));
        
        // Validate reply belongs to the post
        if (!reply.getPost().getId().equals(postId)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Reply does not belong to this post");
        }
        
        // Validate user is post author OR course teacher
        validatePostEditPermission(currentUser, post);
        
        // Remove best answer flag from previous reply (if any)
        List<DiscussionReply> replies = discussionReplyRepository.findByPostIdAndIsDeletedFalse(postId);
        replies.forEach(r -> {
            if (r.getIsBestAnswer()) {
                r.setIsBestAnswer(false);
            }
        });
        
        // Set new best answer
        reply.setIsBestAnswer(true);
        post.setHasBestAnswer(true);
        
        discussionPostRepository.save(post);
        discussionReplyRepository.save(reply);
        
        // Send notification to reply author
        if (!reply.getAuthor().getId().equals(currentUser.getId())) {
            // Determine route based on reply author role (priority: ADMIN > TEACHER > STUDENT)
            String route;
            if (currentUserService.hasRole(reply.getAuthor(), RoleName.ADMIN)) {
                route = "/admin/courses/" + post.getCourse().getId() + "?tab=discussion";
            } else if (currentUserService.hasRole(reply.getAuthor(), RoleName.TEACHER)) {
                route = "/teacher/courses/" + post.getCourse().getId() + "?tab=discussion";
            } else {
                route = "/student/courses/" + post.getCourse().getId() + "?tab=discussion";
            }
            
            notificationService.sendById(
                reply.getAuthor().getId(),
                "DISCUSSION_BEST_ANSWER",
                "Câu trả lời của bạn được chọn là tốt nhất!",
                "Câu trả lời của bạn trong bài \"" + post.getTitle() + "\" đã được đánh dấu là câu trả lời tốt nhất.",
                route
            );
        }
        
        return discussionPostMapper.toResponse(post);
    }

    /**
     * Unmark best answer
     */
    public DiscussionPostResponse unmarkBestAnswer(Long postId) {
        User currentUser = currentUserService.requireCurrentUser();
        
        DiscussionPost post = discussionPostRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Post not found"));
        
        // Validate user is post author OR course teacher
        validatePostEditPermission(currentUser, post);
        
        // Remove best answer flag from all replies
        List<DiscussionReply> replies = discussionReplyRepository.findByPostIdAndIsDeletedFalse(postId);
        replies.forEach(r -> {
            if (r.getIsBestAnswer()) {
                r.setIsBestAnswer(false);
                discussionReplyRepository.save(r);
            }
        });
        
        // Set post hasBestAnswer to false
        post.setHasBestAnswer(false);
        discussionPostRepository.save(post);
        
        return discussionPostMapper.toResponse(post);
    }

    // ── Helper methods ──────────────────────────────────────────────

    private void validateCourseMembership(User user, Course course) {
        boolean isAdmin = currentUserService.isAdmin(user);
        boolean isTeacher = currentUserService.hasRole(user, RoleName.TEACHER) &&
                (course.getTeachers().stream().anyMatch(t -> t.getId().equals(user.getId())) ||
                 (course.getCreatedBy() != null && course.getCreatedBy().getId().equals(user.getId())));
        boolean isStudent = currentUserService.hasRole(user, RoleName.STUDENT) &&
                course.getStudents().stream().anyMatch(s -> s.getId().equals(user.getId()));
        
        if (!isAdmin && !isTeacher && !isStudent) {
            throw new AppException(ErrorCode.FORBIDDEN, "You are not a member of this course");
        }
    }

    private void validatePostEditPermission(User user, DiscussionPost post) {
        boolean isAdmin = currentUserService.isAdmin(user);
        boolean isAuthor = post.getAuthor().getId().equals(user.getId());
        boolean isTeacher = currentUserService.hasRole(user, RoleName.TEACHER) &&
                (post.getCourse().getTeachers().stream().anyMatch(t -> t.getId().equals(user.getId())) ||
                 (post.getCourse().getCreatedBy() != null && post.getCourse().getCreatedBy().getId().equals(user.getId())));
        
        if (!isAdmin && !isAuthor && !isTeacher) {
            throw new AppException(ErrorCode.FORBIDDEN, "You do not have permission to edit this post");
        }
    }
}
