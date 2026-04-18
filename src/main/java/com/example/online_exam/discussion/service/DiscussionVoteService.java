package com.example.online_exam.discussion.service;

import com.example.online_exam.course.entity.Course;
import com.example.online_exam.discussion.entity.DiscussionPost;
import com.example.online_exam.discussion.entity.DiscussionReply;
import com.example.online_exam.discussion.entity.DiscussionVote;
import com.example.online_exam.discussion.enums.PostStatus;
import com.example.online_exam.discussion.enums.VoteType;
import com.example.online_exam.discussion.repository.DiscussionPostRepository;
import com.example.online_exam.discussion.repository.DiscussionReplyRepository;
import com.example.online_exam.discussion.repository.DiscussionVoteRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.enums.RoleName;
import com.example.online_exam.websocket.service.WebSocketService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class DiscussionVoteService {

    private final DiscussionVoteRepository discussionVoteRepository;
    private final DiscussionPostRepository discussionPostRepository;
    private final DiscussionReplyRepository discussionReplyRepository;
    private final CurrentUserService currentUserService;
    private final WebSocketService webSocketService;

    /**
     * Task 8.1: Vote on a post
     */
    public void votePost(Long postId, VoteType voteType) {
        User currentUser = currentUserService.requireCurrentUser();
        
        DiscussionPost post = discussionPostRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Post not found"));
        
        // Validate user is course member
        validateCourseMembership(currentUser, post.getCourse());
        
        Optional<DiscussionVote> existingVote = discussionVoteRepository.findByUserIdAndPostId(currentUser.getId(), postId);
        
        if (existingVote.isEmpty()) {
            // No previous vote: create new vote
            DiscussionVote vote = new DiscussionVote();
            vote.setUser(currentUser);
            vote.setPost(post);
            vote.setVoteType(voteType);
            discussionVoteRepository.save(vote);
            
            // Update post counts
            if (voteType == VoteType.UPVOTE) {
                post.setVoteCount(post.getVoteCount() + 1);
            } else {
                post.setDislikeCount((post.getDislikeCount() == null ? 0 : post.getDislikeCount()) + 1);
            }
        } else {
            // Previous vote exists
            DiscussionVote vote = existingVote.get();
            VoteType oldVoteType = vote.getVoteType();
            
            if (oldVoteType == voteType) {
                // Same vote type: remove vote (toggle off)
                discussionVoteRepository.delete(vote);
                
                // Adjust counts
                if (oldVoteType == VoteType.UPVOTE) {
                    post.setVoteCount(post.getVoteCount() - 1);
                } else {
                    post.setDislikeCount((post.getDislikeCount() == null ? 0 : post.getDislikeCount()) - 1);
                }
                discussionPostRepository.save(post);
                return;
            }
            
            // Different vote type: update vote and adjust counts
            vote.setVoteType(voteType);
            discussionVoteRepository.save(vote);
            
            // Adjust counts: upvote→downvote (-1 like, +1 dislike), downvote→upvote (+1 like, -1 dislike)
            if (oldVoteType == VoteType.UPVOTE && voteType == VoteType.DOWNVOTE) {
                post.setVoteCount(post.getVoteCount() - 1);
                post.setDislikeCount((post.getDislikeCount() == null ? 0 : post.getDislikeCount()) + 1);
            } else if (oldVoteType == VoteType.DOWNVOTE && voteType == VoteType.UPVOTE) {
                post.setVoteCount(post.getVoteCount() + 1);
                post.setDislikeCount((post.getDislikeCount() == null ? 0 : post.getDislikeCount()) - 1);
            }
        }
        
        discussionPostRepository.save(post);
        
        // Send websocket event: vote changed
        webSocketService.sendToTopic(
                "post:" + postId + ":votes",
                "discussion:vote:changed",
                Map.of(
                        "postId", postId,
                        "courseId", post.getCourse().getId(),
                        "voteCount", post.getVoteCount(),
                        "dislikeCount", post.getDislikeCount() != null ? post.getDislikeCount() : 0
                )
        );
    }

    /**
     * Task 8.3: Vote on a reply
     */
    public void voteReply(Long replyId, VoteType voteType) {
        User currentUser = currentUserService.requireCurrentUser();
        
        DiscussionReply reply = discussionReplyRepository.findById(replyId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Reply not found"));
        
        if (reply.getIsDeleted()) {
            throw new AppException(ErrorCode.NOT_FOUND, "Reply not found");
        }
        
        // Validate user is course member
        validateCourseMembership(currentUser, reply.getPost().getCourse());
        
        Optional<DiscussionVote> existingVote = discussionVoteRepository.findByUserIdAndReplyId(currentUser.getId(), replyId);
        
        if (existingVote.isEmpty()) {
            // No previous vote: create new vote
            DiscussionVote vote = new DiscussionVote();
            vote.setUser(currentUser);
            vote.setReply(reply);
            vote.setVoteType(voteType);
            discussionVoteRepository.save(vote);
            
            // Update reply counts
            if (voteType == VoteType.UPVOTE) {
                reply.setVoteCount(reply.getVoteCount() + 1);
            } else {
                reply.setDislikeCount((reply.getDislikeCount() == null ? 0 : reply.getDislikeCount()) + 1);
            }
        } else {
            // Previous vote exists
            DiscussionVote vote = existingVote.get();
            VoteType oldVoteType = vote.getVoteType();
            
            if (oldVoteType == voteType) {
                // Same vote type: remove vote (toggle off)
                discussionVoteRepository.delete(vote);
                
                // Adjust counts
                if (oldVoteType == VoteType.UPVOTE) {
                    reply.setVoteCount(reply.getVoteCount() - 1);
                } else {
                    reply.setDislikeCount((reply.getDislikeCount() == null ? 0 : reply.getDislikeCount()) - 1);
                }
                discussionReplyRepository.save(reply);
                return;
            }
            
            // Different vote type: update vote and adjust counts
            vote.setVoteType(voteType);
            discussionVoteRepository.save(vote);
            
            // Adjust counts: upvote→downvote (-1 like, +1 dislike), downvote→upvote (+1 like, -1 dislike)
            if (oldVoteType == VoteType.UPVOTE && voteType == VoteType.DOWNVOTE) {
                reply.setVoteCount(reply.getVoteCount() - 1);
                reply.setDislikeCount((reply.getDislikeCount() == null ? 0 : reply.getDislikeCount()) + 1);
            } else if (oldVoteType == VoteType.DOWNVOTE && voteType == VoteType.UPVOTE) {
                reply.setVoteCount(reply.getVoteCount() + 1);
                reply.setDislikeCount((reply.getDislikeCount() == null ? 0 : reply.getDislikeCount()) - 1);
            }
        }
        
        discussionReplyRepository.save(reply);
    }

    /**
     * Task 8.4: Remove vote from post
     */
    public void removeVoteFromPost(Long postId) {
        User currentUser = currentUserService.requireCurrentUser();
        
        DiscussionPost post = discussionPostRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Post not found"));
        
        DiscussionVote vote = discussionVoteRepository.findByUserIdAndPostId(currentUser.getId(), postId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Vote not found"));
        
        // Adjust post voteCount based on removed vote type
        if (vote.getVoteType() == VoteType.UPVOTE) {
            post.setVoteCount(post.getVoteCount() - 1);
        } else {
            post.setVoteCount(post.getVoteCount() + 1);
        }
        
        discussionVoteRepository.delete(vote);
        discussionPostRepository.save(post);
    }

    /**
     * Task 8.5: Remove vote from reply
     */
    public void removeVoteFromReply(Long replyId) {
        User currentUser = currentUserService.requireCurrentUser();
        
        DiscussionReply reply = discussionReplyRepository.findById(replyId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Reply not found"));
        
        if (reply.getIsDeleted()) {
            throw new AppException(ErrorCode.NOT_FOUND, "Reply not found");
        }
        
        DiscussionVote vote = discussionVoteRepository.findByUserIdAndReplyId(currentUser.getId(), replyId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Vote not found"));
        
        // Adjust reply voteCount based on removed vote type
        if (vote.getVoteType() == VoteType.UPVOTE) {
            reply.setVoteCount(reply.getVoteCount() - 1);
        } else {
            reply.setVoteCount(reply.getVoteCount() + 1);
        }
        
        discussionVoteRepository.delete(vote);
        discussionReplyRepository.save(reply);
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
}
