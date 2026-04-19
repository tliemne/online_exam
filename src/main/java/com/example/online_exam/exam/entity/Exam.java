package com.example.online_exam.exam.entity;

import com.example.online_exam.common.entity.BaseEntity;
import com.example.online_exam.course.entity.Course;
import com.example.online_exam.exam.enums.ExamStatus;
import com.example.online_exam.user.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
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

    @NotBlank(message = "Tiêu đề đề thi là bắt buộc")
    @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Thời gian làm bài là bắt buộc")
    @Min(value = 1, message = "Thời gian làm bài phải ít nhất 1 phút")
    @Max(value = 600, message = "Thời gian làm bài không được vượt quá 600 phút (10 giờ)")
    @Column(nullable = false)
    private Integer durationMinutes; // Thời gian làm bài (phút)

    private LocalDateTime startTime; // Thời gian mở đề
    private LocalDateTime endTime;   // Thời gian đóng đề

    @NotNull(message = "Tổng điểm là bắt buộc")
    @DecimalMin(value = "0.0", message = "Tổng điểm phải không âm")
    @DecimalMax(value = "1000.0", message = "Tổng điểm không được vượt quá 1000")
    private Double totalScore = 10.0;  // Tổng điểm tối đa
    
    @NotNull(message = "Điểm đạt là bắt buộc")
    @DecimalMin(value = "0.0", message = "Điểm đạt phải không âm")
    private Double passScore  = 5.0;   // Điểm đạt

    private Boolean randomizeQuestions = false;
    
    @Min(value = 1, message = "Số lần làm bài phải ít nhất 1")
    @Max(value = 100, message = "Số lần làm bài không được vượt quá 100")
    private Integer maxAttempts = 1;
    
    private Boolean allowResume = false; // Lưu tiến trình khi thoát (false = reset khi vào lại)
    
    @Min(value = 0, message = "Số lần chuyển tab phải không âm")
    @Max(value = 50, message = "Số lần chuyển tab không được vượt quá 50")
    private Integer maxTabViolations = 3; // Số lần chuyển tab tối đa trước khi kết thúc bài
    
    @Min(value = 0, message = "Số lần thoát phải không âm")
    @Max(value = 50, message = "Số lần thoát không được vượt quá 50")
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

    // ========== Custom Validation Methods ==========
    
    /**
     * Validates that pass score does not exceed total score
     */
    @AssertTrue(message = "Điểm đạt không được vượt quá tổng điểm")
    public boolean isPassScoreValid() {
        if (passScore == null || totalScore == null) return true;
        return passScore <= totalScore;
    }
    
    /**
     * Validates that end time is after start time
     */
    @AssertTrue(message = "Thời gian kết thúc phải sau thời gian bắt đầu")
    public boolean isTimeRangeValid() {
        if (startTime == null || endTime == null) return true;
        return endTime.isAfter(startTime);
    }
}