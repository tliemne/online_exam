package com.example.online_exam.notification.service;

import com.example.online_exam.notification.dto.NotificationResponse;
import com.example.online_exam.notification.entity.Notification;
import com.example.online_exam.notification.repository.NotificationRepository;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notifRepo;
    private final CurrentUserService     currentUserService;
    private final UserRepository         userRepository;

    // ── Send — nhận userId thay vì User object để tránh LazyInit ─────────
    @Async
    @Transactional
    public void sendById(Long recipientId, String type, String title, String message, String link) {
        try {
            User recipient = userRepository.findById(recipientId).orElse(null);
            if (recipient == null) return;
            Notification n = Notification.builder()
                    .recipient(recipient)
                    .type(type).title(title).message(message).link(link)
                    .isRead(false).build();
            notifRepo.save(n);
        } catch (Exception e) {
            log.warn("[Notification] send error: {}", e.getMessage());
        }
    }

    // ── Convenience methods — nhận User.getId() ───────────────────────────
    public void examPublished(User student, String examTitle, String examLink) {
        sendById(student.getId(), "EXAM_PUBLISHED",
                "Đề thi mới: " + examTitle,
                "Một đề thi mới vừa được mở. Hãy vào làm bài ngay!",
                examLink);
    }

    public void attemptGraded(User student, String examTitle, Double score, Double total) {
        String scoreStr = score != null ? String.format("%.1f/%.1f", score, total) : "đang chờ";
        sendById(student.getId(), "ATTEMPT_GRADED",
                "Kết quả: " + examTitle,
                "Bài thi đã được chấm. Điểm: " + scoreStr,
                "/student/results");
    }

    public void essayGraded(User student, String examTitle) {
        sendById(student.getId(), "ESSAY_GRADED",
                "Câu tự luận đã được chấm: " + examTitle,
                "Giảng viên đã chấm xong phần tự luận của bạn.",
                "/student/results");
    }

    // ── Query ─────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public NotificationResponse.Page getMyNotifications(int page, int size) {
        User user = currentUserService.requireCurrentUser();
        List<Notification> list = notifRepo.findByRecipientIdOrderByCreatedAtDesc(
                user.getId(), PageRequest.of(page, size));
        long unread = notifRepo.countByRecipientIdAndIsReadFalse(user.getId());
        return NotificationResponse.Page.builder()
                .notifications(list.stream().map(this::toResponse).toList())
                .unreadCount(unread).build();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        return notifRepo.countByRecipientIdAndIsReadFalse(
                currentUserService.requireCurrentUser().getId());
    }

    @Transactional
    public void markRead(Long id) {
        notifRepo.markReadById(id, currentUserService.requireCurrentUser().getId());
    }

    @Transactional
    public void markAllRead() {
        notifRepo.markAllReadByUser(currentUserService.requireCurrentUser().getId());
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId()).type(n.getType()).title(n.getTitle())
                .message(n.getMessage()).link(n.getLink())
                .isRead(n.isRead()).createdAt(n.getCreatedAt()).build();
    }
}