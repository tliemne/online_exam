package com.example.online_exam.discussion.scheduler;

import com.example.online_exam.discussion.service.ViolationEmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler để gửi email thông báo vi phạm
 * Chạy mỗi 1 phút
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ViolationEmailScheduler {

    private final ViolationEmailService emailService;

    /**
     * Chạy mỗi 1 phút (60000 ms)
     * Gửi email cho tất cả thông báo chưa gửi
     */
    @Scheduled(fixedDelay = 60000, initialDelay = 30000)
    public void sendPendingEmails() {
        try {
            emailService.sendPendingViolationEmails();
        } catch (Exception e) {
            log.error("Error in sendPendingEmails scheduler", e);
        }
    }
}
