package com.example.online_exam.exam.service;

import com.example.online_exam.common.service.EmailService;
import com.example.online_exam.exam.entity.Exam;
import com.example.online_exam.exam.enums.ExamStatus;
import com.example.online_exam.exam.repository.ExamRepository;
import com.example.online_exam.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduler tự động publish/close đề thi theo startTime/endTime.
 * Chạy mỗi phút để kiểm tra.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ExamScheduler {

    private final ExamRepository      examRepo;
    private final NotificationService notificationService;
    private final ExamCacheService    examCacheService;
    private final EmailService        emailService;

    /**
     * Auto-publish: Đề thi DRAFT có startTime <= now → chuyển sang PUBLISHED
     * Chạy mỗi phút
     */
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void autoPublish() {
        LocalDateTime now = LocalDateTime.now();
        List<Exam> toPublish = examRepo.findDraftExamsReadyToPublish(now);

        if (toPublish.isEmpty()) return;

        log.info("[ExamScheduler] Auto-publishing {} exams", toPublish.size());

        for (Exam exam : toPublish) {
            if (exam.getExamQuestions().isEmpty()) {
                log.warn("[ExamScheduler] Skipping exam {} - no questions", exam.getId());
                continue;
            }

            exam.setStatus(ExamStatus.PUBLISHED);
            examRepo.save(exam);
            examCacheService.evict(exam.getId());

            log.info("[ExamScheduler] Published exam: {} (id={})", exam.getTitle(), exam.getId());

            // Gửi thông báo cho sinh viên
            if (exam.getCourse() != null && exam.getCourse().getStudents() != null) {
                String courseName = exam.getCourse().getName();
                exam.getCourse().getStudents().forEach(student -> {
                    try {
                        if (student.getEmail() != null && !student.getEmail().endsWith("@school.edu.vn")) {
                            emailService.sendExamPublished(
                                    student.getEmail(), student.getFullName(),
                                    exam.getTitle(), courseName,
                                    exam.getStartTime(), exam.getEndTime(),
                                    exam.getDurationMinutes());
                        }
                        notificationService.examPublished(student, exam.getTitle(), "/student/exams");
                    } catch (Exception e) {
                        log.warn("[ExamScheduler] Failed to notify student {}: {}", student.getId(), e.getMessage());
                    }
                });
            }
        }
    }

    /**
     * Auto-close: Đề thi PUBLISHED có endTime <= now → chuyển sang CLOSED
     * Chạy mỗi phút
     */
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void autoClose() {
        LocalDateTime now = LocalDateTime.now();
        List<Exam> toClose = examRepo.findPublishedExamsReadyToClose(now);

        if (toClose.isEmpty()) return;

        log.info("[ExamScheduler] Auto-closing {} exams", toClose.size());

        for (Exam exam : toClose) {
            exam.setStatus(ExamStatus.CLOSED);
            examRepo.save(exam);
            examCacheService.evict(exam.getId());
            log.info("[ExamScheduler] Closed exam: {} (id={})", exam.getTitle(), exam.getId());
        }
    }
}
