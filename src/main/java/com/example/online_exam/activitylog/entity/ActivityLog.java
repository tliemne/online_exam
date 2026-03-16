package com.example.online_exam.activitylog.entity;

import com.example.online_exam.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "activity_logs", indexes = {
        @Index(name = "idx_log_user",      columnList = "user_id"),
        @Index(name = "idx_log_action",    columnList = "action"),
        @Index(name = "idx_log_created",   columnList = "created_at"),
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Eager load user để tránh LazyInitializationException khi mapping DTO
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;

    // Loại hành động — dùng String để linh hoạt
    @Column(nullable = false, length = 64)
    private String action;

    // Loại đối tượng bị tác động
    @Column(length = 64)
    private String targetType;      // EXAM, QUESTION, COURSE, USER, ATTEMPT, ...


    private Long targetId;


    @Column(columnDefinition = "TEXT")
    private String description;


    @Column(length = 64)
    private String ipAddress;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}