package com.example.online_exam.announcement.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

public class AnnouncementDto {

    @Data
    public static class Request {
        private String title;
        private String content;
    }

    @Data @Builder
    public static class Response {
        private Long          id;
        private String        title;
        private String        content;
        private Long          authorId;
        private String        authorName;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}