package com.example.online_exam.notification.entity;

import com.example.online_exam.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notif_user",    columnList = "user_id"),
        @Index(name = "idx_notif_read",    columnList = "is_read"),
        @Index(name = "idx_notif_created", columnList = "created_at"),
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User recipient;

    /** EXAM_PUBLISHED / ATTEMPT_GRADED / EXAM_GRADED / SYSTEM */
    @Column(nullable = false, length = 32)
    private String type;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    /** Link điều hướng khi click (vd: /student/results) */
    @Column(length = 255)
    private String link;

    @Column(nullable = false)
    private boolean isRead = false;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}