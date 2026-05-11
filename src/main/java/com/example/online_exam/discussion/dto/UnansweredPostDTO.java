package com.example.online_exam.discussion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnansweredPostDTO {
    private Long postId;
    private String title;
    private String authorName;
    private String authorUsername;
    private Long courseId;
    private String courseName;
    private int replyCount;
    private LocalDateTime createdAt;
}
