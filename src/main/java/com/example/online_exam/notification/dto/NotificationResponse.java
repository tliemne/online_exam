package com.example.online_exam.notification.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data @Builder
public class NotificationResponse {
    private Long          id;
    private String        type;
    private String        title;
    private String        message;
    private String        link;
    private boolean       isRead;
    private LocalDateTime createdAt;

    @Data @Builder
    public static class Page {
        private List<NotificationResponse> notifications;
        private long                        unreadCount;
    }
}