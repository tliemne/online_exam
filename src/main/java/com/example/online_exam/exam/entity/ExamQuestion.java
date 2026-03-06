package com.example.online_exam.exam.entity;

import com.example.online_exam.question.entity.Question;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "exam_questions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"exam_id", "question_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ExamQuestion {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(nullable = false)
    private Double score = 1.0; // Điểm câu này

    @Column(nullable = false)
    private Integer orderIndex = 0; // Thứ tự hiển thị
}