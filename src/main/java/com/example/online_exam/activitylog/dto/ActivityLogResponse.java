package com.example.online_exam.activitylog.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Builder
public class ActivityLogResponse {
    private Long id;
    private Long userId;
    private String username;
    private String fullName;
    private String action;
    private String targetType;
    private Long targetId;
    private String description;
    private String ipAddress;
    private LocalDateTime createdAt;
}