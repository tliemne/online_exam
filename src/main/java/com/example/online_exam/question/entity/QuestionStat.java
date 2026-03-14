package com.example.online_exam.question.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Thống kê tỷ lệ đúng/sai cho từng câu hỏi.
 * Cập nhật tự động sau mỗi lần submit/grade attempt.
 *
 * DifficultyFlag tự động:
 *   correctRate >= 0.85 → TOO_EASY
 *   correctRate <= 0.30 → TOO_HARD
 *   else                → OK
 */
@Entity
@Table(name = "question_statistics")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class QuestionStat {

    @Id
    @Column(name = "question_id")
    private Long questionId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "question_id")
    private Question question;

    @Column(nullable = false)
    private int totalAttempts = 0;    // tổng số lần câu này được trả lời

    @Column(nullable = false)
    private int correctCount  = 0;    // số lần đúng

    @Column(nullable = false)
    private double correctRate = 0.0; // correctCount / totalAttempts

    /** TOO_EASY / TOO_HARD / OK */
    @Column(length = 20)
    private String difficultyFlag = "OK";

    private LocalDateTime lastUpdated;

    @PrePersist @PreUpdate
    protected void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }
}