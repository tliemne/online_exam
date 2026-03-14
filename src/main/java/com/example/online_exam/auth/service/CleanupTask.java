package com.example.online_exam.auth.service;

import com.example.online_exam.activitylog.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Dọn dẹp activity log cũ — chạy 3:05 AM hàng ngày.
 * Cấu hình số ngày giữ log trong application.yml:
 *   app.activity-log.retention-days: 30
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CleanupTask {

    private final ActivityLogRepository activityLogRepository;

    @Value("${app.activity-log.retention-days}")
    private int retentionDays;

    @Scheduled(cron = "${app.activity-log.cleanup-cron}")
    @Transactional
    public void cleanupOldActivityLogs() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(retentionDays);
        int deleted = activityLogRepository.deleteOlderThan(cutoff);
        log.info("Cleanup: deleted {} activity logs older than {} days", deleted, retentionDays);
    }
}