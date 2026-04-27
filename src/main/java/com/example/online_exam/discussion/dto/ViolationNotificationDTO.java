package com.example.online_exam.discussion.dto;

import com.example.online_exam.discussion.enums.ViolationActionType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ViolationNotificationDTO {

    private Long id;

    private Long userId;

    private Long violationId;

    private ViolationActionType actionType;

    private String message;

    private String reason;

    private Boolean isRead;

    private LocalDateTime readAt;

    private LocalDateTime expiresAt;

    private LocalDateTime sentAt;

    private Boolean emailSent;

    private LocalDateTime emailSentAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
