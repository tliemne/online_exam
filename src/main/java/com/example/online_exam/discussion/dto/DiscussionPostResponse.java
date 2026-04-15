package com.example.online_exam.discussion.dto;

import com.example.online_exam.discussion.enums.PostStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class DiscussionPostResponse {
    private Long id;
    private String title;
    private String content;
    private Long courseId;
    private String courseName;
    private AuthorDTO author;
    private PostStatus status;
    private Integer voteCount;
    private Integer dislikeCount;
    private Integer replyCount;
    private Boolean hasBestAnswer;
    private List<String> tags;
    private String currentUserVote; // null, "UPVOTE", "DOWNVOTE"
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Attachments (images, files)
    private List<AttachmentDTO> attachments;
    
    // Include replies when fetching post detail
    private List<DiscussionReplyResponse> replies;
}
