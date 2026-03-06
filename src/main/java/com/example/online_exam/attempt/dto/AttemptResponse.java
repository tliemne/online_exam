package com.example.online_exam.attempt.dto;


import com.example.online_exam.attempt.enums.AttemptStatus;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class AttemptResponse {
    private Long id;
    private Long examId;
    private String examTitle;
    private String courseName;

    private String studentName;
    private String studentCode;

    private AttemptStatus status;
    private Double score;
    private Double totalScore;
    private Boolean passed;

    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;

    // Số câu đúng / tổng
    private Integer correctCount;
    private Integer totalQuestions;

    // Chi tiết từng câu (khi teacher chấm)
    private List<AttemptAnswerDetail> answers;

    @Data
    public static class AttemptAnswerDetail {
        private Long id;
        private Long questionId;
        private String questionContent;
        private String questionType;

        private Long selectedAnswerId;
        private String selectedAnswerContent;
        private String textAnswer;

        private Boolean isCorrect;
        private Double score;
        private String teacherComment;

        // Đáp án đúng (chỉ trả khi đã submit)
        private Long correctAnswerId;
        private String correctAnswerContent;
    }
}