package com.example.online_exam.attempt.entity;

import com.example.online_exam.attempt.enums.AttemptStatus;
import com.example.online_exam.exam.entity.Exam;
import com.example.online_exam.user.entity.User;
import jakarta.persistence.*;
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
    private Double score;
    private Double totalScore;
    private Boolean passed;

    // Thời gian
    @CreationTimestamp
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private Integer timeRemainingSeconds; // Thời gian còn lại (giây) — lưu khi thoát
    private Integer tabViolationCount = 0; // Số lần chuyển tab vi phạm

    // Câu trả lời
    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AttemptAnswer> answers = new ArrayList<>();
}