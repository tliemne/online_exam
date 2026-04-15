package com.example.online_exam.discussion.service;

import com.example.online_exam.course.entity.Course;
import com.example.online_exam.discussion.dto.DiscussionReplyRequest;
import com.example.online_exam.discussion.dto.DiscussionReplyResponse;
import com.example.online_exam.discussion.entity.DiscussionPost;
import com.example.online_exam.discussion.entity.DiscussionReply;
import com.example.online_exam.discussion.enums.PostStatus;
import com.example.online_exam.discussion.mapper.DiscussionReplyMapper;
import com.example.online_exam.discussion.repository.DiscussionPostRepository;
import com.example.online_exam.discussion.repository.DiscussionReplyRepository;
import com.example.online_exam.discussion.repository.DiscussionVoteRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.enums.RoleName;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DiscussionReplyService {

    private final DiscussionReplyRepository discussionReplyRepository;
    private final DiscussionPostRepository discussionPostRepository;
    private final DiscussionVoteRepository discussionVoteRepository;
    private final DiscussionReplyMapper discussionReplyMapper;
    private final CurrentUserService currentUserService;
    private final com.example.online_exam.notification.service.NotificationService notificationService;
    private final com.example.online_exam.discussion.repository.DiscussionAttachmentRepository attachmentRepository;
    private final FileUploadService fileUploadService;

    /**
     * Task 7.1: Create a new reply
     */
    public DiscussionReplyResponse createReply(Long postId, DiscussionReplyRequest request) {
        User currentUser = currentUserService.requireCurrentUser();
        
        DiscussionPost post = discussionPostRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Post not found"));
        
        // Validate user is course member
        validateCourseMembership(currentUser, post.getCourse());
        
        // Create reply
        DiscussionReply reply = new DiscussionReply();
        reply.setContent(request.getContent());
        reply.setPost(post);
        reply.setAuthor(currentUser);
        reply.setVoteCount(0);
        reply.setDislikeCount(0);
        reply.setIsBestAnswer(false);
        reply.setIsDeleted(false);
        
        // Handle nested reply (reply to reply)
        if (request.getParentReplyId() != null) {
            DiscussionReply parentReply = discussionReplyRepository.findById(request.getParentReplyId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Parent reply not found"));
            
            if (!parentReply.getPost().getId().equals(postId)) {
                throw new AppException(ErrorCode.INVALID_REQUEST, "Parent reply does not belong to this post");
            }
            
            reply.setParentReply(parentReply);
        }
        
        discussionReplyRepository.save(reply);
        
        // Increment parent post's replyCount
        post.setReplyCount(post.getReplyCount() + 1);
        discussionPostRepository.save(post);
        
        // Send notification to post author (always)
        if (!post.getAuthor().getId().equals(currentUser.getId())) {
            // Determine route based on post author role (priority: ADMIN > TEACHER > STUDENT)
            String route;
            if (currentUserService.hasRole(post.getAuthor(), RoleName.ADMIN)) {
                route = "/admin/courses/" + post.getCourse().getId() + "?tab=discussion";
            } else if (currentUserService.hasRole(post.getAuthor(), RoleName.TEACHER)) {
                route = "/teacher/courses/" + post.getCourse().getId() + "?tab=discussion";
            } else {
                route = "/student/courses/" + post.getCourse().getId() + "?tab=discussion";
            }
            
            notificationService.sendById(
                post.getAuthor().getId(),
                "DISCUSSION_REPLY",
                "Có người trả lời bài viết của bạn",
                currentUser.getFullName() + " đã trả lời bài viết \"" + post.getTitle() + "\"",
                route
            );
        }
        
        // Send notification to parent reply author (if nested reply)
        if (request.getParentReplyId() != null) {
            DiscussionReply parentReply = reply.getParentReply();
            if (!parentReply.getAuthor().getId().equals(currentUser.getId()) && 
                !parentReply.getAuthor().getId().equals(post.getAuthor().getId())) {
                
                // Determine route based on parent reply author role
                String route;
                if (currentUserService.hasRole(parentReply.getAuthor(), RoleName.ADMIN)) {
                    route = "/admin/courses/" + post.getCourse().getId() + "?tab=discussion";
                } else if (currentUserService.hasRole(parentReply.getAuthor(), RoleName.TEACHER)) {
                    route = "/teacher/courses/" + post.getCourse().getId() + "?tab=discussion";
                } else {
                    route = "/student/courses/" + post.getCourse().getId() + "?tab=discussion";
                }
                
                notificationService.sendById(
                    parentReply.getAuthor().getId(),
                    "DISCUSSION_REPLY_TO_REPLY",
                    "Có người trả lời bình luận của bạn",
                    currentUser.getFullName() + " đã trả lời bình luận của bạn trong bài \"" + post.getTitle() + "\"",
                    route
                );
            }
        }
        
        // Send notification to all students if teacher replies
        if (currentUserService.hasRole(currentUser, RoleName.TEACHER)) {
            post.getCourse().getStudents().forEach(student -> {
                if (!student.getId().equals(currentUser.getId()) && !student.getId().equals(post.getAuthor().getId())) {
                    String route = "/student/courses/" + post.getCourse().getId() + "?tab=discussion";
                    notificationService.sendById(
                        student.getId(),
                        "DISCUSSION_TEACHER_REPLY",
                        "Giáo viên đã trả lời",
                        currentUser.getFullName() + " đã trả lời bài viết \"" + post.getTitle() + "\"",
                        route
                    );
                }
            });
        }
        
        return discussionReplyMapper.toResponse(reply);
    }

    /**
     * Task 7.3: Update a reply
     */
    public DiscussionReplyResponse updateReply(Long replyId, DiscussionReplyRequest request) {
        User currentUser = currentUserService.requireCurrentUser();
        
        DiscussionReply reply = discussionReplyRepository.findById(replyId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Reply not found"));
        
        if (reply.getIsDeleted()) {
            throw new AppException(ErrorCode.NOT_FOUND, "Reply not found");
        }
        
        // Validate user is reply author OR course teacher
        validateReplyEditPermission(currentUser, reply);
        
        // Validate reply was created less than 24 hours ago
        if (reply.getCreatedAt().isBefore(LocalDateTime.now().minusHours(24))) {
            throw new AppException(ErrorCode.FORBIDDEN, "Cannot edit reply older than 24 hours");
        }
        
        // Update content
        reply.setContent(request.getContent());
        discussionReplyRepository.save(reply);
        
        return discussionReplyMapper.toResponse(reply);
    }

    /**
     * Task 7.4: Delete a reply (hard delete)
     * Xóa hẳn reply và tất cả dữ liệu liên quan:
     * - Tất cả attachments (files + database)
     * - Tất cả votes
     * - Tất cả nested replies (replies con)
     */
    public void deleteReply(Long replyId) {
        User currentUser = currentUserService.requireCurrentUser();
        
        DiscussionReply reply = discussionReplyRepository.findById(replyId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Reply not found"));
        
        if (reply.getIsDeleted()) {
            throw new AppException(ErrorCode.NOT_FOUND, "Reply not found");
        }
        
        // Validate user is reply author OR course teacher OR admin
        validateReplyEditPermission(currentUser, reply);
        
        // 1. Get all nested replies (replies to this reply)
        List<DiscussionReply> nestedReplies = discussionReplyRepository.findByParentReplyId(replyId);
        
        // 2. Delete attachments and votes for nested replies
        for (DiscussionReply nested : nestedReplies) {
            // Delete nested reply attachments
            List<com.example.online_exam.discussion.entity.DiscussionAttachment> nestedAttachments = 
                attachmentRepository.findByReplyIdOrderByCreatedAtAsc(nested.getId());
            for (com.example.online_exam.discussion.entity.DiscussionAttachment attachment : nestedAttachments) {
                fileUploadService.deleteFile(attachment.getFilePath());
            }
            attachmentRepository.deleteAll(nestedAttachments);
            
            // Delete nested reply votes
            discussionVoteRepository.deleteByReplyId(nested.getId());
        }
        
        // 3. Delete all nested replies
        discussionReplyRepository.deleteAll(nestedReplies);
        
        // 4. Delete this reply's attachments (files + database)
        List<com.example.online_exam.discussion.entity.DiscussionAttachment> attachments = 
            attachmentRepository.findByReplyIdOrderByCreatedAtAsc(replyId);
        for (com.example.online_exam.discussion.entity.DiscussionAttachment attachment : attachments) {
            fileUploadService.deleteFile(attachment.getFilePath());
        }
        attachmentRepository.deleteAll(attachments);
        
        // 5. Delete this reply's votes
        discussionVoteRepository.deleteByReplyId(replyId);
        
        // 6. If reply was best answer, set post.hasBestAnswer=false
        if (reply.getIsBestAnswer()) {
            DiscussionPost post = reply.getPost();
            post.setHasBestAnswer(false);
            discussionPostRepository.save(post);
        }
        
        // 7. Delete reply (hard delete)
        discussionReplyRepository.delete(reply);
    }

    /**
     * Task 7.5: Get replies by post
     */
    public List<DiscussionReplyResponse> getRepliesByPost(Long postId) {
        User currentUser = currentUserService.requireCurrentUser();
        
        DiscussionPost post = discussionPostRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Post not found"));
        
        // Validate user is course member
        validateCourseMembership(currentUser, post.getCourse());
        
        // Fetch non-deleted replies
        List<DiscussionReply> replies = discussionReplyRepository.findByPostIdAndIsDeletedFalse(postId);
        
        // Map replies and set current user votes
        return replies.stream()
                .map(reply -> {
                    DiscussionReplyResponse response = discussionReplyMapper.toResponse(reply);
                    discussionVoteRepository.findByUserIdAndReplyId(currentUser.getId(), reply.getId())
                            .ifPresent(vote -> response.setCurrentUserVote(vote.getVoteType().name()));
                    return response;
                })
                .sorted(Comparator
                        .comparing(DiscussionReplyResponse::getIsBestAnswer, Comparator.reverseOrder())
                        .thenComparing(DiscussionReplyResponse::getVoteCount, Comparator.reverseOrder()))
                .collect(Collectors.toList());
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

    private void validateReplyEditPermission(User user, DiscussionReply reply) {
        boolean isAdmin = currentUserService.isAdmin(user);
        boolean isAuthor = reply.getAuthor().getId().equals(user.getId());
        boolean isPostAuthor = reply.getPost().getAuthor().getId().equals(user.getId());
        Course course = reply.getPost().getCourse();
        boolean isTeacher = currentUserService.hasRole(user, RoleName.TEACHER) &&
                (course.getTeachers().stream().anyMatch(t -> t.getId().equals(user.getId())) ||
                 (course.getCreatedBy() != null && course.getCreatedBy().getId().equals(user.getId())));
        
        if (!isAdmin && !isAuthor && !isPostAuthor && !isTeacher) {
            throw new AppException(ErrorCode.FORBIDDEN, "You do not have permission to edit this reply");
        }
    }
}
