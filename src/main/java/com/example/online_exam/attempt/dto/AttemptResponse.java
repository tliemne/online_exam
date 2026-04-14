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

    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String studentCode;

    private AttemptStatus status;
    private Double score;
    private Double totalScore;
    private Boolean passed;

    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private Integer timeRemainingSeconds;
    private Integer tabViolationCount;
    private Boolean allowResume;
    private String questionOrder; // JSON: [id1, id2, id3, ...] — thứ tự xáo trộn
    private Integer exitCount; // Số lần thoát ra


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
        private Double maxScore;  // Điểm tối đa của câu này (từ ExamQuestion)
        private String teacherComment;

        // Đáp án đúng (chỉ trả khi đã submit)
        private Long correctAnswerId;
        private String correctAnswerContent;
    }
}