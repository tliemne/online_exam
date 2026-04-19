package com.example.online_exam.question.entity;

import com.example.online_exam.common.entity.BaseEntity;
import com.example.online_exam.tag.entity.Tag;
import com.example.online_exam.course.entity.Course;
import com.example.online_exam.question.enums.Difficulty;
import com.example.online_exam.question.enums.QuestionType;
import com.example.online_exam.user.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questions", indexes = {
        @Index(name = "idx_question_course",     columnList = "course_id"),
        @Index(name = "idx_question_type",       columnList = "type"),
        @Index(name = "idx_question_difficulty", columnList = "difficulty"),
        @Index(name = "idx_question_course_type",columnList = "course_id, type"),
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Question extends BaseEntity {

    @NotBlank(message = "Nội dung câu hỏi là bắt buộc")
    @Size(min = 10, message = "Nội dung câu hỏi phải có ít nhất 10 ký tự")
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @NotNull(message = "Loại câu hỏi là bắt buộc")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestionType type;

    @NotNull(message = "Mức độ khó là bắt buộc")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Difficulty difficulty = Difficulty.MEDIUM;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Answer> answers = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "question_tags",
            joinColumns = @JoinColumn(name = "question_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private java.util.Set<Tag> tags = new java.util.HashSet<>();
}