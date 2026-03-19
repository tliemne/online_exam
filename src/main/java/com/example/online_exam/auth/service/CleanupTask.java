package com.example.online_exam.auth.service;

import com.example.online_exam.activitylog.repository.ActivityLogRepository;
import com.example.online_exam.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Dọn dẹp dữ liệu cũ hàng ngày lúc 3 AM.
 * - Activity log > 90 ngày
 * - Notification đã đọc > 30 ngày
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CleanupTask {

    private final ActivityLogRepository  activityLogRepository;
    private final NotificationRepository notificationRepository;

    @Scheduled(cron = "0 5 3 * * *")
    @Transactional
    public void cleanupOldActivityLogs() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(90);
        int deleted = activityLogRepository.deleteOlderThan(cutoff);
        log.info("Cleanup: deleted {} activity logs older than 90 days", deleted);
    }

    // Thông báo đã đọc > 30 ngày — không cần giữ lâu hơn
    @Scheduled(cron = "0 10 3 * * *")
    @Transactional
    public void cleanupOldNotifications() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
        int deleted = notificationRepository.deleteReadOlderThan(cutoff);
        log.info("Cleanup: deleted {} read notifications older than 30 days", deleted);
    }
}