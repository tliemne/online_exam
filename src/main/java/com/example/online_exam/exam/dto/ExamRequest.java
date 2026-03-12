package com.example.online_exam.exam.dto;

import com.example.online_exam.exam.enums.ExamStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ExamRequest {

    @NotBlank
    private String title;

    private String description;

    @NotNull @Min(1)
    private Integer durationMinutes;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private Double totalScore   = 10.0;
    private Double passScore    = 5.0;
    private Boolean randomizeQuestions = false;
    private Integer maxAttempts = 1;
    private Boolean allowResume = false;

    @NotNull
    private Long courseId;

    // Danh sách câu hỏi thêm vào đề (có thể để trống, thêm sau)
    private List<ExamQuestionItem> questions;
}