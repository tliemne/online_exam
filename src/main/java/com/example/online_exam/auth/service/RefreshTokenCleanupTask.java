package com.example.online_exam.auth.service;

import com.example.online_exam.activitylog.repository.ActivityLogRepository;
import com.example.online_exam.auth.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Scheduled jobs dọn dẹp dữ liệu tạm:
 * - Xóa refresh token hết hạn (3 AM hàng ngày)
 * - Xóa activity log > 90 ngày (3:05 AM hàng ngày)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenCleanupTask {

    private final RefreshTokenRepository refreshTokenRepository;
    private final ActivityLogRepository activityLogRepository;

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        int deleted = refreshTokenRepository.deleteAllExpiredBefore(LocalDateTime.now());
        log.info("Cleanup: deleted {} expired refresh tokens", deleted);
    }

    // Giữ log 90 ngày — đủ để audit, không phình DB
    @Scheduled(cron = "0 5 3 * * *")
    @Transactional
    public void cleanupOldActivityLogs() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(90);
        int deleted = activityLogRepository.deleteOlderThan(cutoff);
        log.info("Cleanup: deleted {} activity logs older than 90 days", deleted);
    }
}