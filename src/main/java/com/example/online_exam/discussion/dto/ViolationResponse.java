package com.example.online_exam.discussion.dto;

import com.example.online_exam.discussion.enums.ViolationActionType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ViolationResponse {
    private Long id;
    private ViolationActionType actionType;
    private String reason;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private Boolean isActive;
    
    // Admin who took action
    private Long adminId;
    private String adminUsername;
    
    // Related content
    private Long postId;
    private String postTitle;
    private Long replyId;
    
    // For user viewing their own violations
    private String contentPreview;
}
