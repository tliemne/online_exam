package com.example.online_exam.attempt.entity;

import com.example.online_exam.attempt.enums.AttemptStatus;
import com.example.online_exam.exam.entity.Exam;
import com.example.online_exam.user.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "attempts", indexes = {
        @Index(name = "idx_attempt_student",        columnList = "student_id"),
        @Index(name = "idx_attempt_exam",           columnList = "exam_id"),
        @Index(name = "idx_attempt_student_exam",   columnList = "student_id, exam_id"),
        @Index(name = "idx_attempt_status",         columnList = "status"),
        @Index(name = "idx_attempt_submitted_at",   columnList = "submitted_at"),
})
@Getter @Setter
public class Attempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttemptStatus status = AttemptStatus.IN_PROGRESS;

    // Điểm số
    @DecimalMin(value = "0.0", message = "Điểm phải không âm")
    private Double score;
    
    @DecimalMin(value = "0.0", message = "Tổng điểm phải không âm")
    private Double totalScore;
    
    private Boolean passed;

    // Thời gian
    @CreationTimestamp
    private LocalDateTime startedAt;
    
    private LocalDateTime submittedAt;
    
    @Min(value = 0, message = "Thời gian còn lại phải không âm")
    private Integer timeRemainingSeconds; // Thời gian còn lại (giây) — lưu khi thoát
    
    @Min(value = 0, message = "Số lần chuyển tab phải không âm")
    @Max(value = 1000, message = "Số lần chuyển tab không được vượt quá 1000")
    private Integer tabViolationCount = 0; // Số lần chuyển tab vi phạm
    
    @Min(value = 0, message = "Số lần thoát phải không âm")
    @Max(value = 1000, message = "Số lần thoát không được vượt quá 1000")
    private Integer exitCount = 0; // Số lần thoát ra khỏi bài thi

    // Câu trả lời
    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AttemptAnswer> answers = new ArrayList<>();

    // Thứ tự câu hỏi xáo trộn (JSON: [questionId1, questionId2, ...])
    @Column(columnDefinition = "TEXT")
    private String questionOrder;

    // ========== Custom Validation Methods ==========
    
    /**
     * Validates that score does not exceed total score
     */
    @AssertTrue(message = "Điểm không được vượt quá tổng điểm")
    public boolean isScoreValid() {
        if (score == null || totalScore == null) return true;
        return score <= totalScore;
    }
    
    /**
     * Validates that submitted time is after started time
     */
    @AssertTrue(message = "Thời gian nộp phải sau thời gian bắt đầu")
    public boolean isSubmittedTimeValid() {
        if (startedAt == null || submittedAt == null) return true;
        return submittedAt.isAfter(startedAt) || submittedAt.isEqual(startedAt);
    }
}