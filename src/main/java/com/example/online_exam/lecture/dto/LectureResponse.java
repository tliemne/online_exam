package com.example.online_exam.lecture.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class LectureResponse {
    private Long id;
    private Long courseId;
    private String title;
    private String description;
    private String videoUrl;
    private Integer orderIndex;
    private String createdByName;
    private LocalDateTime createdAt;
}