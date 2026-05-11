package com.example.online_exam.discussion.service;

import com.example.online_exam.activitylog.entity.ActivityLogAction;
import com.example.online_exam.activitylog.service.ActivityLogService;
import com.example.online_exam.discussion.dto.ModerationActionRequest;
import com.example.online_exam.discussion.dto.ReportResponse;
import com.example.online_exam.discussion.dto.UserViolationStatsDTO;
import com.example.online_exam.discussion.entity.*;
import com.example.online_exam.discussion.enums.*;
import com.example.online_exam.discussion.repository.*;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.notification.service.NotificationService;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.repository.UserRepository;
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
public class AdminModerationService {

    private final DiscussionReportRepository reportRepository;
    private final UserViolationRepository violationRepository;
    private final DiscussionPostRepository postRepository;
    private final DiscussionReplyRepository replyRepository;
    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;
    private final DiscussionReportService reportService;
    private final ViolationNotificationService notificationService;
    private final NotificationService mainNotificationService;
    private final ActivityLogService activityLogService;

    public Page<ReportResponse> getPendingReports(Pageable pageable) {
        validateAdmin();
        return reportRepository.findByStatus(ReportStatus.PENDING, pageable)
                .map(reportService::mapToResponse);
    }

    public ReportResponse getReportDetails(Long reportId) {
        validateAdmin();
        DiscussionReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Report not found"));
        return reportService.mapToResponse(report);
    }

    public ReportResponse dismissReport(Long reportId, ModerationActionRequest request) {
        User admin = validateAdmin();
        DiscussionReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Report not found"));

        report.setStatus(ReportStatus.DISMISSED);
        report.setReviewedBy(admin);
        report.setResolutionNote(request.getReason());
        reportRepository.save(report);

        activityLogService.logUser(admin, ActivityLogAction.DISMISS_REPORT,
                "REPORT", reportId, "Bỏ qua báo cáo #" + reportId);
        return reportService.mapToResponse(report);
    }

    public ReportResponse deleteContent(Long reportId, ModerationActionRequest request) {
        User admin = validateAdmin();
        DiscussionReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Report not found"));

        if (report.getPost() != null) {
            report.getPost().setStatus(PostStatus.DELETED);
            postRepository.save(report.getPost());
        } else if (report.getReply() != null) {
            report.getReply().setIsDeleted(true);
            replyRepository.save(report.getReply());
        }

        report.setStatus(ReportStatus.ACTION_TAKEN);
        report.setReviewedBy(admin);
        report.setResolutionNote("Content deleted: " + request.getReason());
        reportRepository.save(report);

        String target = report.getPost() != null ? "bài viết #" + report.getPost().getId() : "bình luận #" + (report.getReply() != null ? report.getReply().getId() : "?");
        activityLogService.logUser(admin, ActivityLogAction.DELETE_CONTENT,
                "REPORT", reportId, "Xóa nội dung vi phạm: " + target);
        return reportService.mapToResponse(report);
    }

    public ReportResponse warnUser(Long reportId, ModerationActionRequest request) {
        User admin = validateAdmin();
        DiscussionReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Report not found"));

        User author = getContentAuthor(report);
        UserViolation violation = createViolation(author, admin, report, ViolationActionType.WARNING, request.getReason(), null);

        // Tạo violation notification
        notificationService.createNotification(violation);

        // Gửi thông báo vào bell của user bị cảnh cáo — link đến bài viết liên quan
        String link = buildContentLink(report);
        mainNotificationService.sendById(
            author.getId(),
            "WARNING",
            "Bạn đã bị cảnh cáo",
            "Lý do: " + request.getReason(),
            link
        );

        report.setStatus(ReportStatus.ACTION_TAKEN);
        report.setReviewedBy(admin);
        report.setResolutionNote("User warned: " + request.getReason());
        reportRepository.save(report);

        activityLogService.logUser(admin, ActivityLogAction.WARN_USER,
                "USER", author.getId(), "Cảnh cáo user: " + author.getUsername() + " — " + request.getReason());
        return reportService.mapToResponse(report);
    }

    public ReportResponse muteUser(Long reportId, ModerationActionRequest request) {
        User admin = validateAdmin();
        DiscussionReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Report not found"));

        User author = getContentAuthor(report);
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(request.getMuteDurationDays());
        UserViolation violation = createViolation(author, admin, report, ViolationActionType.MUTE, request.getReason(), expiresAt);

        // Tạo violation notification
        notificationService.createNotification(violation);

        // Gửi thông báo vào bell của user bị tạm khóa
        String link = buildContentLink(report);
        mainNotificationService.sendById(
            author.getId(),
            "MUTE",
            "Bạn đã bị tạm khóa " + request.getMuteDurationDays() + " ngày",
            "Lý do: " + request.getReason(),
            link
        );

        report.setStatus(ReportStatus.ACTION_TAKEN);
        report.setReviewedBy(admin);
        report.setResolutionNote("User muted for " + request.getMuteDurationDays() + " days");
        reportRepository.save(report);

        activityLogService.logUser(admin, ActivityLogAction.MUTE_USER,
                "USER", author.getId(), "Tạm khóa user: " + author.getUsername() + " " + request.getMuteDurationDays() + " ngày — " + request.getReason());
        return reportService.mapToResponse(report);
    }

    public ReportResponse banUser(Long reportId, ModerationActionRequest request) {
        User admin = validateAdmin();
        DiscussionReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Report not found"));

        User author = getContentAuthor(report);
        UserViolation violation = createViolation(author, admin, report, ViolationActionType.BAN, request.getReason(), null);

        // Tạo violation notification
        notificationService.createNotification(violation);

        // Gửi thông báo vào bell của user bị cấm
        String link = buildContentLink(report);
        mainNotificationService.sendById(
            author.getId(),
            "BAN",
            "Tài khoản của bạn đã bị cấm vĩnh viễn",
            "Lý do: " + request.getReason(),
            link
        );

        report.setStatus(ReportStatus.ACTION_TAKEN);
        report.setReviewedBy(admin);
        report.setResolutionNote("User banned: " + request.getReason());
        reportRepository.save(report);

        activityLogService.logUser(admin, ActivityLogAction.BAN_USER,
                "USER", author.getId(), "Cấm vĩnh viễn user: " + author.getUsername() + " — " + request.getReason());
        return reportService.mapToResponse(report);
    }

    public UserViolationStatsDTO getUserViolationStats(Long userId) {
        validateAdmin();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "User not found"));

        List<UserViolation> violations = violationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        long warningCount = violations.stream().filter(v -> v.getActionType() == ViolationActionType.WARNING).count();
        long muteCount = violations.stream().filter(v -> v.getActionType() == ViolationActionType.MUTE).count();
        long banCount = violations.stream().filter(v -> v.getActionType() == ViolationActionType.BAN).count();
        long contentDeletedCount = violations.stream().filter(v -> v.getActionType() == ViolationActionType.CONTENT_DELETED).count();

        boolean isCurrentlyBanned = violationRepository.findActiveBanByUserId(userId).isPresent();
        boolean isCurrentlyMuted = violationRepository.findActiveMuteByUserId(userId, LocalDateTime.now()).isPresent();

        UserViolationStatsDTO stats = new UserViolationStatsDTO();
        stats.setUserId(userId);
        stats.setUsername(user.getUsername());
        stats.setFullName(user.getFullName());
        stats.setTotalViolations((long) violations.size());
        stats.setWarningCount(warningCount);
        stats.setMuteCount(muteCount);
        stats.setBanCount(banCount);
        stats.setContentDeletedCount(contentDeletedCount);
        stats.setIsCurrentlyBanned(isCurrentlyBanned);
        stats.setIsCurrentlyMuted(isCurrentlyMuted);
        stats.setSuggestedAction(calculateSuggestedAction(warningCount, muteCount, banCount));

        return stats;
    }

    private UserViolation createViolation(User user, User admin, DiscussionReport report, ViolationActionType actionType, String reason, LocalDateTime expiresAt) {
        UserViolation violation = new UserViolation();
        violation.setUser(user);
        violation.setAdmin(admin);
        violation.setReport(report);
        violation.setActionType(actionType);
        violation.setReason(reason);
        violation.setExpiresAt(expiresAt);
        violation.setIsActive(true);

        if (report.getPost() != null) {
            violation.setPost(report.getPost());
        } else if (report.getReply() != null) {
            violation.setReply(report.getReply());
        }

        return violationRepository.save(violation);
    }

    private String calculateSuggestedAction(long warningCount, long muteCount, long banCount) {
        if (banCount > 0) return "ALREADY_BANNED";
        if (muteCount >= 2 || warningCount >= 3) return "BAN";
        if (muteCount >= 1 || warningCount >= 2) return "MUTE_7_DAYS";
        if (warningCount >= 1) return "MUTE_3_DAYS";
        return "WARNING";
    }

    private User validateAdmin() {
        User currentUser = currentUserService.requireCurrentUser();
        if (!currentUserService.isAdmin(currentUser)) {
            throw new AppException(ErrorCode.FORBIDDEN, "Only admins can perform moderation actions");
        }
        return currentUser;
    }

    private User getContentAuthor(DiscussionReport report) {
        if (report.getPost() != null) return report.getPost().getAuthor();
        if (report.getReply() != null) return report.getReply().getAuthor();
        throw new AppException(ErrorCode.INVALID_REQUEST, "Report has no associated content");
    }

    private String buildContentLink(DiscussionReport report) {
        // Link đến bài viết cụ thể dựa theo role của user bị phạt
        Long courseId = null;
        Long postId = null;
        User author = getContentAuthor(report);

        if (report.getPost() != null) {
            courseId = report.getPost().getCourse().getId();
            postId = report.getPost().getId();
        } else if (report.getReply() != null) {
            courseId = report.getReply().getPost().getCourse().getId();
            postId = report.getReply().getPost().getId();
        }

        if (courseId == null || postId == null) return "/user/violations";

        // Xác định route theo role
        boolean isTeacher = author.getRoles().stream()
                .anyMatch(r -> r.getName().name().equals("TEACHER"));
        String prefix = isTeacher ? "/teacher" : "/student";
        return prefix + "/courses/" + courseId + "?tab=discussion&postId=" + postId;
    }
}
