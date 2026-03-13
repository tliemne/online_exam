package com.example.online_exam.auth.service;

import com.example.online_exam.activitylog.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Dọn dẹp activity log cũ hơn 90 ngày — 3:05 AM hàng ngày.
 * RefreshToken không cần cleanup vì Redis tự xóa khi hết TTL.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CleanupTask {

    private final ActivityLogRepository activityLogRepository;

    @Scheduled(cron = "0 5 3 * * *")
    @Transactional
    public void cleanupOldActivityLogs() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(90);
        int deleted = activityLogRepository.deleteOlderThan(cutoff);
        log.info("Cleanup: deleted {} activity logs older than 90 days", deleted);
    }
}