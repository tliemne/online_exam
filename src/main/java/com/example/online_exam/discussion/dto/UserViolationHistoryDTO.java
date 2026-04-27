package com.example.online_exam.discussion.dto;

import com.example.online_exam.discussion.enums.ViolationActionType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserViolationHistoryDTO {

    private Long id;

    private ViolationActionType actionType;

    private String reason;

    private String adminName;

    private LocalDateTime createdAt;

    private LocalDateTime expiresAt;

    private Boolean isActive;

    private String postTitle;

    private String postContent;

    private String replyContent;

    private LocalDateTime violationCreatedAt;
}
