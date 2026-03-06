package com.example.online_exam.exam.dto;

import com.example.online_exam.exam.enums.ExamStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ExamResponse {
    private Long id;
    private String title;
    private String description;
    private Integer durationMinutes;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Double totalScore;
    private Double passScore;
    private Boolean randomizeQuestions;
    private Integer maxAttempts;
    private ExamStatus status;

    // Course info
    private Long courseId;
    private String courseName;

    // Creator
    private String createdByName;

    // Thống kê
    private Integer questionCount;
    private LocalDateTime createdAt;

    // Danh sách câu hỏi (chỉ trả về khi cần)
    private List<ExamQuestionResponse> questions;
}