package com.example.online_exam.discussion.service;

import com.example.online_exam.discussion.entity.ViolationNotification;
import com.example.online_exam.discussion.enums.ViolationActionType;
import com.example.online_exam.discussion.repository.ViolationNotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Service để gửi email thông báo vi phạm
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ViolationEmailService {

    private final JavaMailSender mailSender;
    private final ViolationNotificationRepository notificationRepository;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.mail.from-name}")
    private String fromName;

    @Value("${app.base-url}")
    private String baseUrl;

    /**
     * Gửi email thông báo vi phạm (async)
     */
    @Async
    public void sendViolationNotificationEmail(ViolationNotification notification) {
        try {
            String subject = buildEmailSubject(notification.getActionType());
            String body = buildEmailBody(notification);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(notification.getUser().getEmail());
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);
            
            // Đánh dấu email đã gửi
            notification.setEmailSent(true);
            notificationRepository.save(notification);
            
            log.info("Sent violation email to {} for {}", notification.getUser().getEmail(), notification.getActionType());
        } catch (Exception e) {
            log.error("Error sending violation email to {}", notification.getUser().getEmail(), e);
        }
    }

    /**
     * Gửi email cho tất cả thông báo chưa gửi
     */
    @Transactional
    public void sendPendingViolationEmails() {
        try {
            List<ViolationNotification> pendingNotifications = notificationRepository.findUnsentEmailNotifications();
            
            for (ViolationNotification notification : pendingNotifications) {
                sendViolationNotificationEmail(notification);
            }
            
            log.info("Sent {} pending violation emails", pendingNotifications.size());
        } catch (Exception e) {
            log.error("Error sending pending violation emails", e);
        }
    }

    /**
     * Build email subject
     */
    private String buildEmailSubject(ViolationActionType actionType) {
        return switch (actionType) {
            case WARNING -> "⚠️ Bạn đã nhận cảnh cáo từ ExamPortal";
            case MUTE -> "🔇 Tài khoản của bạn đang bị tạm khóa";
            case BAN -> "🚫 Tài khoản của bạn đã bị cấm";
            case CONTENT_DELETED -> "🗑️ Nội dung của bạn đã bị xóa";
            default -> "📢 Thông báo từ ExamPortal";
        };
    }

    /**
     * Build email body
     */
    private String buildEmailBody(ViolationNotification notification) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        
        String body = "Xin chào " + notification.getUser().getFullName() + ",\n\n";
        
        body += switch (notification.getActionType()) {
            case WARNING -> buildWarningEmail(notification, formatter);
            case MUTE -> buildMuteEmail(notification, formatter);
            case BAN -> buildBanEmail(notification, formatter);
            case CONTENT_DELETED -> buildContentDeletedEmail(notification, formatter);
            default -> "Bạn có một thông báo mới từ ExamPortal.\n";
        };

        body += "\n\nNếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.\n";
        body += "Trân trọng,\n";
        body += "Đội ngũ ExamPortal\n";
        body += baseUrl;

        return body;
    }

    private String buildWarningEmail(ViolationNotification notification, DateTimeFormatter formatter) {
        return "Bạn đã nhận cảnh cáo vì vi phạm các quy tắc cộng đồng.\n\n" +
                "Lý do: " + notification.getReason() + "\n" +
                "Thời gian: " + notification.getCreatedAt().format(formatter) + "\n\n" +
                "Đây là cảnh cáo đầu tiên. Vui lòng tuân thủ các quy tắc cộng đồng để tránh bị tạm khóa hoặc cấm.\n";
    }

    private String buildMuteEmail(ViolationNotification notification, DateTimeFormatter formatter) {
        return "Tài khoản của bạn đang bị tạm khóa vì vi phạm các quy tắc cộng đồng.\n\n" +
                "Lý do: " + notification.getReason() + "\n" +
                "Thời gian tạm khóa: " + notification.getCreatedAt().format(formatter) + "\n" +
                "Hết hạn: " + notification.getExpiresAt().format(formatter) + "\n\n" +
                "Trong thời gian này, bạn không thể đăng bài hoặc bình luận. Bạn vẫn có thể xem và vote.\n";
    }

    private String buildBanEmail(ViolationNotification notification, DateTimeFormatter formatter) {
        return "Tài khoản của bạn đã bị cấm vĩnh viễn vì vi phạm nghiêm trọng các quy tắc cộng đồng.\n\n" +
                "Lý do: " + notification.getReason() + "\n" +
                "Thời gian: " + notification.getCreatedAt().format(formatter) + "\n\n" +
                "Bạn không thể đăng bài, bình luận hoặc tương tác trên nền tảng.\n" +
                "Nếu bạn muốn kháng cáo, vui lòng liên hệ với chúng tôi.\n";
    }

    private String buildContentDeletedEmail(ViolationNotification notification, DateTimeFormatter formatter) {
        return "Nội dung của bạn đã bị xóa vì vi phạm các quy tắc cộng đồng.\n\n" +
                "Lý do: " + notification.getReason() + "\n" +
                "Thời gian: " + notification.getCreatedAt().format(formatter) + "\n\n" +
                "Vui lòng tuân thủ các quy tắc cộng đồng khi đăng nội dung.\n";
    }
}
