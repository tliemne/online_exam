package com.example.online_exam.discussion.service;

import com.example.online_exam.discussion.dto.ViolationNotificationDTO;
import com.example.online_exam.discussion.entity.UserViolation;
import com.example.online_exam.discussion.entity.ViolationNotification;
import com.example.online_exam.discussion.enums.ViolationActionType;
import com.example.online_exam.discussion.repository.ViolationNotificationRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.user.entity.User;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ViolationNotificationService {

    private final ViolationNotificationRepository notificationRepository;

    /**
     * Tạo thông báo vi phạm mới
     */
    public ViolationNotificationDTO createNotification(UserViolation violation) {
        String message = buildNotificationMessage(violation);

        ViolationNotification notification = new ViolationNotification();
        notification.setUser(violation.getUser());
        notification.setViolation(violation);
        notification.setActionType(violation.getActionType());
        notification.setMessage(message);
        notification.setReason(violation.getReason());
        notification.setIsRead(false);
        notification.setSentAt(LocalDateTime.now());
        notification.setExpiresAt(violation.getExpiresAt());
        notification.setEmailSent(false);

        ViolationNotification saved = notificationRepository.save(notification);
        return mapToDTO(saved);
    }

    /**
     * Lấy tất cả thông báo của user
     */
    public Page<ViolationNotificationDTO> getUserNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::mapToDTO);
    }

    /**
     * Lấy thông báo chưa đọc
     */
    public Page<ViolationNotificationDTO> getUnreadNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId, pageable)
                .map(this::mapToDTO);
    }

    /**
     * Đếm thông báo chưa đọc
     */
    public long countUnreadNotifications(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    /**
     * Lấy số lượng thông báo chưa đọc của user hiện tại
     */
    public long getUnreadCount() {
        // This will be called from controller which has access to current user
        // For now, return 0 - will be overridden in controller
        return 0;
    }

    /**
     * Đánh dấu thông báo là đã đọc
     */
    public ViolationNotificationDTO markAsRead(Long notificationId) {
        ViolationNotification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Notification not found"));

        notification.setIsRead(true);
        notification.setReadAt(LocalDateTime.now());
        ViolationNotification saved = notificationRepository.save(notification);
        return mapToDTO(saved);
    }

    /**
     * Đánh dấu tất cả thông báo là đã đọc
     */
    public void markAllAsRead(Long userId) {
        List<ViolationNotification> unreadNotifications = notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId, Pageable.unpaged())
                .getContent();

        LocalDateTime now = LocalDateTime.now();
        unreadNotifications.forEach(n -> {
            n.setIsRead(true);
            n.setReadAt(now);
        });
        notificationRepository.saveAll(unreadNotifications);
    }

    /**
     * Đánh dấu email đã gửi
     */
    public void markEmailSent(Long notificationId) {
        ViolationNotification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Notification not found"));

        notification.setEmailSent(true);
        notification.setEmailSentAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    /**
     * Lấy thông báo chưa gửi email
     */
    public List<ViolationNotification> getUnsentEmailNotifications() {
        return notificationRepository.findUnsentEmailNotifications();
    }

    /**
     * Lấy thông báo mute đang hoạt động
     */
    public List<ViolationNotificationDTO> getActiveMuteNotifications(Long userId) {
        return notificationRepository.findActiveMuteNotifications(userId, LocalDateTime.now())
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    /**
     * Lấy thông báo ban
     */
    public List<ViolationNotificationDTO> getBanNotifications(Long userId) {
        return notificationRepository.findBanNotifications(userId)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    /**
     * Xóa thông báo
     */
    public void deleteNotification(Long notificationId) {
        notificationRepository.deleteById(notificationId);
    }

    /**
     * Xóa tất cả thông báo của user
     */
    public void deleteAllUserNotifications(Long userId) {
        List<ViolationNotification> notifications = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, Pageable.unpaged())
                .getContent();
        notificationRepository.deleteAll(notifications);
    }

    /**
     * Build thông báo message dựa trên loại vi phạm
     */
    private String buildNotificationMessage(UserViolation violation) {
        return switch (violation.getActionType()) {
            case WARNING -> "Bạn đã nhận cảnh cáo vì: " + violation.getReason();
            case MUTE -> "Bạn đang bị tạm khóa đến " + violation.getExpiresAt() + " vì: " + violation.getReason();
            case BAN -> "Tài khoản của bạn đã bị cấm vĩnh viễn vì: " + violation.getReason();
            case CONTENT_DELETED -> "Nội dung của bạn đã bị xóa vì: " + violation.getReason();
            default -> "Bạn có một thông báo vi phạm mới";
        };
    }

    /**
     * Map entity to DTO
     */
    private ViolationNotificationDTO mapToDTO(ViolationNotification notification) {
        return ViolationNotificationDTO.builder()
                .id(notification.getId())
                .userId(notification.getUser().getId())
                .violationId(notification.getViolation().getId())
                .actionType(notification.getActionType())
                .message(notification.getMessage())
                .reason(notification.getReason())
                .isRead(notification.getIsRead())
                .readAt(notification.getReadAt())
                .expiresAt(notification.getExpiresAt())
                .sentAt(notification.getSentAt())
                .emailSent(notification.getEmailSent())
                .emailSentAt(notification.getEmailSentAt())
                .createdAt(notification.getCreatedAt())
                .updatedAt(notification.getUpdatedAt())
                .build();
    }
}
