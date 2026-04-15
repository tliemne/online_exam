package com.example.online_exam.discussion.controller;

import com.example.online_exam.common.dto.BaseResponse;
import com.example.online_exam.discussion.dto.AttachmentDTO;
import com.example.online_exam.discussion.dto.DiscussionPostRequest;
import com.example.online_exam.discussion.dto.DiscussionPostResponse;
import com.example.online_exam.discussion.dto.DiscussionReplyRequest;
import com.example.online_exam.discussion.dto.DiscussionReplyResponse;
import com.example.online_exam.discussion.dto.DiscussionSearchRequest;
import com.example.online_exam.discussion.dto.ForumStatsResponse;
import com.example.online_exam.discussion.entity.DiscussionAttachment;
import com.example.online_exam.discussion.enums.VoteType;
import com.example.online_exam.discussion.service.DiscussionAttachmentService;
import com.example.online_exam.discussion.service.DiscussionPostService;
import com.example.online_exam.discussion.service.DiscussionReplyService;
import com.example.online_exam.discussion.service.DiscussionSearchService;
import com.example.online_exam.discussion.service.DiscussionStatsService;
import com.example.online_exam.discussion.service.DiscussionVoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DiscussionForumController {

    private final DiscussionPostService discussionPostService;
    private final DiscussionReplyService discussionReplyService;
    private final DiscussionVoteService discussionVoteService;
    private final DiscussionSearchService discussionSearchService;
    private final DiscussionStatsService discussionStatsService;
    private final DiscussionAttachmentService discussionAttachmentService;

    // ═══════════════════════════════════════════════════════════════
    // POST ENDPOINTS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Task 12.1: Create a new discussion post
     */
    @PostMapping("/courses/{courseId}/discussions")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public BaseResponse<DiscussionPostResponse> createPost(
            @PathVariable Long courseId,
            @Valid @RequestBody DiscussionPostRequest request) {
        request.setCourseId(courseId);
        return BaseResponse.<DiscussionPostResponse>builder()
                .status(201)
                .message("Post created successfully")
                .data(discussionPostService.createPost(request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Task 12.2: Get all posts in a course
     */
    @GetMapping("/courses/{courseId}/discussions")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public BaseResponse<Page<DiscussionPostResponse>> getPostsByCourse(
            @PathVariable Long courseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return BaseResponse.<Page<DiscussionPostResponse>>builder()
                .status(200)
                .message("Get posts successfully")
                .data(discussionPostService.getPostsByCourse(courseId, page, size))
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Task 12.3: Get post by ID with all replies
     */
    @GetMapping("/discussions/{postId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public BaseResponse<DiscussionPostResponse> getPostById(@PathVariable Long postId) {
        return BaseResponse.<DiscussionPostResponse>builder()
                .status(200)
                .message("Get post successfully")
                .data(discussionPostService.getPostById(postId))
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Task 12.4: Update a post
     */
    @PutMapping("/discussions/{postId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public BaseResponse<DiscussionPostResponse> updatePost(
            @PathVariable Long postId,
            @Valid @RequestBody DiscussionPostRequest request) {
        return BaseResponse.<DiscussionPostResponse>builder()
                .status(200)
                .message("Post updated successfully")
                .data(discussionPostService.updatePost(postId, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Task 12.5: Delete a post
     */
    @DeleteMapping("/discussions/{postId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public BaseResponse<Void> deletePost(@PathVariable Long postId) {
        discussionPostService.deletePost(postId);
        return BaseResponse.<Void>builder()
                .status(204)
                .message("Post deleted successfully")
                .timestamp(LocalDateTime.now())
                .build();
    }

    // ═══════════════════════════════════════════════════════════════
    // REPLY ENDPOINTS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Task 12.6: Create a reply
     */
    @PostMapping("/discussions/{postId}/replies")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public BaseResponse<DiscussionReplyResponse> createReply(
            @PathVariable Long postId,
            @Valid @RequestBody DiscussionReplyRequest request) {
        return BaseResponse.<DiscussionReplyResponse>builder()
                .status(201)
                .message("Reply created successfully")
                .data(discussionReplyService.createReply(postId, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Task 12.7: Update a reply
     */
    @PutMapping("/discussions/replies/{replyId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public BaseResponse<DiscussionReplyResponse> updateReply(
            @PathVariable Long replyId,
            @Valid @RequestBody DiscussionReplyRequest request) {
        return BaseResponse.<DiscussionReplyResponse>builder()
                .status(200)
                .message("Reply updated successfully")
                .data(discussionReplyService.updateReply(replyId, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Task 12.8: Delete a reply
     */
    @DeleteMapping("/discussions/replies/{replyId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public BaseResponse<Void> deleteReply(@PathVariable Long replyId) {
        discussionReplyService.deleteReply(replyId);
        return BaseResponse.<Void>builder()
                .status(204)
                .message("Reply deleted successfully")
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Get replies by post (optional endpoint)
     */
    @GetMapping("/discussions/{postId}/replies")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public BaseResponse<List<DiscussionReplyResponse>> getRepliesByPost(@PathVariable Long postId) {
        return BaseResponse.<List<DiscussionReplyResponse>>builder()
                .status(200)
                .message("Get replies successfully")
                .data(discussionReplyService.getRepliesByPost(postId))
                .timestamp(LocalDateTime.now())
                .build();
    }

    // ═══════════════════════════════════════════════════════════════
    // VOTE ENDPOINTS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Task 12.9: Vote on a post
     */
    @PostMapping("/discussions/{postId}/vote")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public BaseResponse<Void> votePost(
            @PathVariable Long postId,
            @RequestParam VoteType voteType) {
        discussionVoteService.votePost(postId, voteType);
        return BaseResponse.<Void>builder()
                .status(200)
                .message("Vote recorded successfully")
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Task 12.10: Remove vote from post
     */
    @DeleteMapping("/discussions/{postId}/vote")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public BaseResponse<Void> removeVoteFromPost(@PathVariable Long postId) {
        discussionVoteService.removeVoteFromPost(postId);
        return BaseResponse.<Void>builder()
                .status(204)
                .message("Vote removed successfully")
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Task 12.11: Vote on a reply
     */
    @PostMapping("/discussions/replies/{replyId}/vote")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public BaseResponse<Void> voteReply(
            @PathVariable Long replyId,
            @RequestParam VoteType voteType) {
        discussionVoteService.voteReply(replyId, voteType);
        return BaseResponse.<Void>builder()
                .status(200)
                .message("Vote recorded successfully")
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Task 12.12: Remove vote from reply
     */
    @DeleteMapping("/discussions/replies/{replyId}/vote")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public BaseResponse<Void> removeVoteFromReply(@PathVariable Long replyId) {
        discussionVoteService.removeVoteFromReply(replyId);
        return BaseResponse.<Void>builder()
                .status(204)
                .message("Vote removed successfully")
                .timestamp(LocalDateTime.now())
                .build();
    }

    // ═══════════════════════════════════════════════════════════════
    // BEST ANSWER ENDPOINT
    // ═══════════════════════════════════════════════════════════════

    /**
     * Task 12.13: Mark a reply as best answer
     */
    @PostMapping("/discussions/{postId}/best-answer/{replyId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public BaseResponse<DiscussionPostResponse> markBestAnswer(
            @PathVariable Long postId,
            @PathVariable Long replyId) {
        return BaseResponse.<DiscussionPostResponse>builder()
                .status(200)
                .message("Best answer marked successfully")
                .data(discussionPostService.markBestAnswer(postId, replyId))
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Unmark best answer
     */
    @DeleteMapping("/discussions/{postId}/best-answer")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public BaseResponse<DiscussionPostResponse> unmarkBestAnswer(@PathVariable Long postId) {
        return BaseResponse.<DiscussionPostResponse>builder()
                .status(200)
                .message("Best answer unmarked successfully")
                .data(discussionPostService.unmarkBestAnswer(postId))
                .timestamp(LocalDateTime.now())
                .build();
    }

    // ═══════════════════════════════════════════════════════════════
    // SEARCH ENDPOINT
    // ═══════════════════════════════════════════════════════════════

    /**
     * Task 12.14: Search posts with filters
     */
    @GetMapping("/courses/{courseId}/discussions/search")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public BaseResponse<Page<DiscussionPostResponse>> searchPosts(
            @PathVariable Long courseId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) List<String> tags,
            @RequestParam(required = false) Boolean answered,
            @RequestParam(required = false, defaultValue = "date") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDirection,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        DiscussionSearchRequest searchRequest = new DiscussionSearchRequest();
        searchRequest.setKeyword(keyword);
        searchRequest.setTags(tags);
        searchRequest.setAnswered(answered);
        searchRequest.setSortBy(sortBy);
        searchRequest.setSortDirection(sortDirection);
        
        return BaseResponse.<Page<DiscussionPostResponse>>builder()
                .status(200)
                .message("Search completed successfully")
                .data(discussionSearchService.searchPosts(courseId, searchRequest, page, size))
                .timestamp(LocalDateTime.now())
                .build();
    }

    // ═══════════════════════════════════════════════════════════════
    // STATISTICS ENDPOINT
    // ═══════════════════════════════════════════════════════════════

    /**
     * Task 12.15: Get forum statistics (teachers only)
     */
    @GetMapping("/courses/{courseId}/discussions/stats")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<ForumStatsResponse> getForumStats(@PathVariable Long courseId) {
        return BaseResponse.<ForumStatsResponse>builder()
                .status(200)
                .message("Get statistics successfully")
                .data(discussionStatsService.getCourseForumStats(courseId))
                .timestamp(LocalDateTime.now())
                .build();
    }

    // ═══════════════════════════════════════════════════════════════
    // ATTACHMENT ENDPOINTS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Upload attachment to post
     */
    @PostMapping("/discussions/{postId}/attachments")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public BaseResponse<AttachmentDTO> uploadPostAttachment(
            @PathVariable Long postId,
            @RequestParam("file") MultipartFile file) {
        return BaseResponse.<AttachmentDTO>builder()
                .status(201)
                .message("Attachment uploaded successfully")
                .data(discussionAttachmentService.uploadPostAttachment(postId, file))
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Upload attachment to reply
     */
    @PostMapping("/discussions/replies/{replyId}/attachments")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public BaseResponse<AttachmentDTO> uploadReplyAttachment(
            @PathVariable Long replyId,
            @RequestParam("file") MultipartFile file) {
        return BaseResponse.<AttachmentDTO>builder()
                .status(201)
                .message("Attachment uploaded successfully")
                .data(discussionAttachmentService.uploadReplyAttachment(replyId, file))
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Delete attachment
     */
    @DeleteMapping("/discussions/attachments/{attachmentId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public BaseResponse<Void> deleteAttachment(@PathVariable Long attachmentId) {
        discussionAttachmentService.deleteAttachment(attachmentId);
        return BaseResponse.<Void>builder()
                .status(204)
                .message("Attachment deleted successfully")
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Get/Download attachment file - PUBLIC ACCESS
     */
    @GetMapping("/discussions/attachments/{attachmentId}")
    public ResponseEntity<byte[]> getAttachment(@PathVariable Long attachmentId) {
        DiscussionAttachment attachment = discussionAttachmentService.getAttachment(attachmentId);
        byte[] fileData = discussionAttachmentService.getAttachmentFile(attachmentId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(attachment.getMimeType()));
        headers.setContentDispositionFormData("inline", attachment.getOriginalFilename());
        headers.setContentLength(fileData.length);
        headers.setCacheControl("public, max-age=31536000"); // Cache for 1 year

        return ResponseEntity.ok()
                .headers(headers)
                .body(fileData);
    }

    /**
     * Get thumbnail for image attachment - PUBLIC ACCESS
     */
    @GetMapping("/discussions/attachments/{attachmentId}/thumbnail")
    public ResponseEntity<byte[]> getThumbnail(@PathVariable Long attachmentId) {
        // For now, return the same image (can implement thumbnail generation later)
        DiscussionAttachment attachment = discussionAttachmentService.getAttachment(attachmentId);
        byte[] fileData = discussionAttachmentService.getAttachmentFile(attachmentId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(attachment.getMimeType()));
        headers.setContentLength(fileData.length);
        headers.setCacheControl("public, max-age=31536000"); // Cache for 1 year

        return ResponseEntity.ok()
                .headers(headers)
                .body(fileData);
    }
}
