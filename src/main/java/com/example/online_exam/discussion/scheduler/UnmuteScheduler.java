package com.example.online_exam.discussion.scheduler;

import com.example.online_exam.discussion.entity.UserViolation;
import com.example.online_exam.discussion.enums.ViolationActionType;
import com.example.online_exam.discussion.repository.UserViolationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduler để tự động mở khóa user khi mute hết hạn
 * Chạy mỗi 5 phút
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UnmuteScheduler {

    private final UserViolationRepository violationRepository;

    /**
     * Chạy mỗi 5 phút (300000 ms)
     * Tìm tất cả mute đã hết hạn và deactivate chúng
     */
    @Scheduled(fixedDelay = 300000, initialDelay = 60000)
    @Transactional
    public void autoUnmuteExpiredViolations() {
        try {
            LocalDateTime now = LocalDateTime.now();
            
            // Tìm tất cả mute đã hết hạn
            List<UserViolation> expiredMutes = violationRepository.findAll()
                    .stream()
                    .filter(v -> v.getActionType() == ViolationActionType.MUTE)
                    .filter(v -> v.getIsActive())
                    .filter(v -> v.getExpiresAt() != null && v.getExpiresAt().isBefore(now))
                    .toList();

            if (!expiredMutes.isEmpty()) {
                expiredMutes.forEach(v -> {
                    v.setIsActive(false);
                    log.info("Auto-unmuted user {} - mute expired at {}", v.getUser().getId(), v.getExpiresAt());
                });
                violationRepository.saveAll(expiredMutes);
                log.info("Auto-unmuted {} users", expiredMutes.size());
            }
        } catch (Exception e) {
            log.error("Error in autoUnmuteExpiredViolations scheduler", e);
        }
    }

    /**
     * Chạy mỗi ngày lúc 3:00 AM
     * Dọn dẹp các violation cũ (hơn 90 ngày)
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupOldViolations() {
        try {
            LocalDateTime ninetyDaysAgo = LocalDateTime.now().minusDays(90);
            
            List<UserViolation> oldViolations = violationRepository.findAll()
                    .stream()
                    .filter(v -> v.getCreatedAt().isBefore(ninetyDaysAgo))
                    .filter(v -> !v.getIsActive()) // Chỉ xóa những cái đã inactive
                    .toList();

            if (!oldViolations.isEmpty()) {
                violationRepository.deleteAll(oldViolations);
                log.info("Cleaned up {} old violations", oldViolations.size());
            }
        } catch (Exception e) {
            log.error("Error in cleanupOldViolations scheduler", e);
        }
    }
}
