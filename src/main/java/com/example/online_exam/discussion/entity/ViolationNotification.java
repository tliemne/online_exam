package com.example.online_exam.discussion.entity;

import com.example.online_exam.common.entity.BaseEntity;
import com.example.online_exam.discussion.enums.ViolationActionType;
import com.example.online_exam.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Lưu trữ thông báo vi phạm gửi cho user
 * Khi user bị cảnh cáo/tạm khóa/cấm, sẽ tạo record này
 */
@Entity
@Table(name = "violation_notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ViolationNotification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "violation_id", nullable = false)
    private UserViolation violation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ViolationActionType actionType;

    @Column(nullable = false, length = 1000)
    private String message;

    @Column(nullable = false)
    private String reason;

    @Column(name = "is_read")
    private Boolean isRead = false;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt; // Cho mute: thời gian hết hạn

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "email_sent")
    private Boolean emailSent = false;

    @Column(name = "email_sent_at")
    private LocalDateTime emailSentAt;
}
