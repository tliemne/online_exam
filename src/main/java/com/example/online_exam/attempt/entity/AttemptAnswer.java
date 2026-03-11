package com.example.online_exam.attempt.entity;

import com.example.online_exam.question.entity.Answer;
import com.example.online_exam.question.entity.Question;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "attempt_answers")
@Getter @Setter
public class AttemptAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private Attempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_answer_id",
            foreignKey = @ForeignKey(
                    name = "fk_attempt_answer_selected",
                    foreignKeyDefinition = "FOREIGN KEY (selected_answer_id) REFERENCES answers(id) ON DELETE SET NULL"
            ))
    private Answer selectedAnswer;


    @Column(columnDefinition = "TEXT")
    private String textAnswer;


    private Double score;
    private Boolean isCorrect;


    @Column(columnDefinition = "TEXT")
    private String teacherComment;
}