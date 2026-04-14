package com.example.online_exam.exam.entity;

import com.example.online_exam.common.entity.BaseEntity;
import com.example.online_exam.course.entity.Course;
import com.example.online_exam.exam.enums.ExamStatus;
import com.example.online_exam.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "exams", indexes = {
        @Index(name = "idx_exam_course",     columnList = "course_id"),
        @Index(name = "idx_exam_status",     columnList = "status"),
        @Index(name = "idx_exam_created_by", columnList = "created_by"),
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Exam extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer durationMinutes; // Thời gian làm bài (phút)

    private LocalDateTime startTime; // Thời gian mở đề
    private LocalDateTime endTime;   // Thời gian đóng đề

    private Double totalScore = 10.0;  // Tổng điểm tối đa
    private Double passScore  = 5.0;   // Điểm đạt

    private Boolean randomizeQuestions = false;
    private Integer maxAttempts = 1;
    private Boolean allowResume = false; // Lưu tiến trình khi thoát (false = reset khi vào lại)
    private Integer maxTabViolations = 3; // Số lần chuyển tab tối đa trước khi kết thúc bài
    private Integer maxExitAttempts = 1; // Số lần thoát ra tối đa (0 = không giới hạn)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExamStatus status = ExamStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<ExamQuestion> examQuestions = new ArrayList<>();
}