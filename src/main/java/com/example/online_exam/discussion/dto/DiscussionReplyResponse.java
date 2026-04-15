package com.example.online_exam.discussion.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DiscussionReplyResponse {
    private Long id;
    private String content;
    private Long postId;
    private Long parentReplyId;
    private AuthorDTO author;
    private Integer voteCount;
    private Integer dislikeCount;
    private Boolean isBestAnswer;
    private String currentUserVote; // null, "UPVOTE", "DOWNVOTE"
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Attachments (images, files)
    private java.util.List<AttachmentDTO> attachments;
}
