package com.example.online_exam.common.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.mail.from-name:ExamPortal}")
    private String fromName;

    @Value("${app.base-url:http://localhost:3000}")
    private String baseUrl;

    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

    // ─────────────────────────────────────────────────────
    // 1. Tài khoản mới (tạo thủ công + import Excel)
    // ─────────────────────────────────────────────────────
    @Async("emailExecutor")
    public void sendStudentCredentials(String toEmail, String studentName,
                                       String username, String plainPassword,
                                       String courseName) {
        send(toEmail,
                "[ExamPortal] Thông tin tài khoản của bạn",
                buildCredentialsEmail(studentName, username, plainPassword, courseName));
    }

    // ─────────────────────────────────────────────────────
    // 2. Đặt lại mật khẩu
    // ─────────────────────────────────────────────────────
    @Async("emailExecutor")
    public void sendPasswordReset(String toEmail, String fullName, String newPassword) {
        send(toEmail,
                "[ExamPortal] Mật khẩu của bạn đã được đặt lại",
                buildResetEmail(fullName, newPassword));
    }

    // ─────────────────────────────────────────────────────
    // 3. Giáo viên publish đề → thông báo toàn bộ SV lớp
    //    (Gọi riêng từng SV — mỗi lần 1 email để Async xử lý song song)
    // ─────────────────────────────────────────────────────
    @Async("emailExecutor")
    public void sendExamPublished(String toEmail, String studentName,
                                  String examTitle, String courseName,
                                  LocalDateTime startTime, LocalDateTime endTime,
                                  Integer durationMinutes) {
        send(toEmail,
                "[ExamPortal] Đề thi mới: " + examTitle,
                buildExamPublishedEmail(studentName, examTitle, courseName,
                        startTime, endTime, durationMinutes));
    }

    // ─────────────────────────────────────────────────────
    // 4. Kết quả thi (auto-grade trắc nghiệm + teacher chấm essay)
    // ─────────────────────────────────────────────────────
    @Async("emailExecutor")
    public void sendGradeResult(String toEmail, String fullName,
                                String examTitle, String courseName,
                                Double score, Double totalScore, Boolean passed) {
        send(toEmail,
                "[ExamPortal] Kết quả bài thi: " + examTitle,
                buildGradeEmail(fullName, examTitle, courseName, score, totalScore, passed));
    }

    // ─────────────────────────────────────────────────────
    // Internal sender — dùng chung, log đầy đủ
    // ─────────────────────────────────────────────────────
    private void send(String toEmail, String subject, String html) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(msg, true, "UTF-8");
            h.setFrom(fromEmail, fromName);
            h.setTo(toEmail);
            h.setSubject(subject);
            h.setText(html, true);
            mailSender.send(msg);
            log.info("✅ Email sent [{}] → {}", subject, toEmail);
        } catch (Exception e) {
            log.error("❌ Email failed [{}] → {} | {}: {}", subject, toEmail,
                    e.getClass().getSimpleName(), e.getMessage());
        }
    }

    // ═════════════════════════════════════════════════════
    // HTML TEMPLATES
    // ═════════════════════════════════════════════════════

    private String header(String bgColor, String title, String subtitle) {
        return """
        <!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"/></head>
        <body style="margin:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif">
        <div style="max-width:580px;margin:40px auto;background:#fff;border-radius:14px;
                    box-shadow:0 6px 20px rgba(0,0,0,0.08);overflow:hidden">
            <div style="background:%s;padding:28px;text-align:center">
                <h2 style="color:#fff;margin:0;font-size:22px;font-weight:800">ExamPortal</h2>
                <p style="color:rgba(255,255,255,0.8);margin-top:6px;font-size:13px">%s</p>
            </div>
            <div style="padding:32px">
        """.formatted(bgColor, subtitle == null ? title : subtitle);
    }

    private String footer() {
        return """
            </div>
            <div style="background:#f9fafb;padding:18px;text-align:center;border-top:1px solid #eee">
                <p style="font-size:12px;color:#9ca3af;margin:0">© 2026 ExamPortal. All rights reserved.</p>
            </div>
        </div></body></html>
        """;
    }

    // ── Template 1: Credentials ───────────────────────────
    private String buildCredentialsEmail(String name, String username,
                                         String password, String courseName) {
        String courseInfo = courseName != null
                ? " và đã được thêm vào lớp <b>" + courseName + "</b>" : "";
        return header("#4f46e5", "Thông tin tài khoản", "Hệ thống thi trực tuyến") + """
            <p style="font-size:16px;color:#111;margin:0 0 10px">Xin chào <b>%s</b>,</p>
            <p style="color:#555;font-size:14px;line-height:1.6;margin-bottom:24px">
                Tài khoản của bạn trên <b>ExamPortal</b> đã được tạo%s.
            </p>
            <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;
                        padding:20px;margin-bottom:24px">
                <div style="margin-bottom:14px">
                    <div style="font-size:12px;color:#6b7280;margin-bottom:3px">Tên đăng nhập</div>
                    <div style="font-family:monospace;font-size:16px;font-weight:bold;color:#111">%s</div>
                </div>
                <div>
                    <div style="font-size:12px;color:#6b7280;margin-bottom:3px">Mật khẩu</div>
                    <div style="font-family:monospace;font-size:16px;font-weight:bold;color:#ef4444">%s</div>
                </div>
            </div>
            <div style="text-align:center;margin-bottom:24px">
                <a href="%s/login"
                   style="background:#4f46e5;color:#fff;text-decoration:none;
                          padding:13px 28px;border-radius:8px;font-weight:bold;font-size:14px">
                   Đăng nhập hệ thống →</a>
            </div>
            <div style="background:#fff7ed;border:1px solid #fed7aa;padding:13px;border-radius:8px">
                <p style="margin:0;font-size:13px;color:#9a3412">
                    Hãy đổi mật khẩu sau khi đăng nhập lần đầu để đảm bảo bảo mật.
                </p>
            </div>
        """.formatted(baseUrl, name, courseInfo, username, password) + footer();
    }

    // ── Template 2: Password Reset ────────────────────────
    private String buildResetEmail(String name, String newPassword) {
        return header("#dc2626", "Đặt lại mật khẩu", "Bảo mật tài khoản") + """
            <p style="font-size:16px;color:#111">Xin chào <b>%s</b>,</p>
            <p style="font-size:14px;color:#555;line-height:1.6">
                Mật khẩu của bạn đã được quản trị viên đặt lại.
            </p>
            <div style="margin:24px 0;background:#fef2f2;border:1px solid #fecaca;
                        border-radius:10px;padding:24px;text-align:center">
                <div style="font-size:12px;color:#7f1d1d;margin-bottom:8px">Mật khẩu mới</div>
                <div style="font-family:monospace;font-size:24px;font-weight:bold;
                            color:#dc2626;letter-spacing:3px">%s</div>
            </div>
            <div style="text-align:center;margin-bottom:20px">
                <a href="%s/login"
                   style="background:#dc2626;color:#fff;text-decoration:none;
                          padding:13px 28px;border-radius:8px;font-weight:bold;font-size:14px">
                   Đăng nhập ngay →</a>
            </div>
            <div style="background:#fff7ed;border:1px solid #fed7aa;padding:13px;border-radius:8px">
                <p style="margin:0;font-size:13px;color:#9a3412">
                    Hãy đổi mật khẩu ngay sau khi đăng nhập để đảm bảo an toàn.
                </p>
            </div>
        """.formatted(baseUrl, name, newPassword) + footer();
    }

    // ── Template 3: Exam Published ────────────────────────
    private String buildExamPublishedEmail(String name, String examTitle, String courseName,
                                           LocalDateTime startTime, LocalDateTime endTime,
                                           Integer durationMinutes) {
        String startStr = startTime != null ? startTime.format(DT) : "Ngay bây giờ";
        String endStr   = endTime   != null ? endTime.format(DT)   : "Không giới hạn";
        String duration = durationMinutes != null ? durationMinutes + " phút" : "Không giới hạn";

        return header("#0891b2", "Đề thi mới", "Thông báo từ hệ thống") + """
            <p style="font-size:16px;color:#111;margin:0 0 8px">Xin chào <b>%s</b>,</p>
            <p style="color:#555;font-size:14px;line-height:1.6;margin-bottom:22px">
                Giảng viên vừa mở một bài thi mới trong lớp của bạn. Hãy chuẩn bị!
            </p>

            <!-- Exam info card -->
            <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;
                        padding:20px;margin-bottom:22px">
                <p style="margin:0 0 4px;font-size:12px;color:#0369a1;text-transform:uppercase;
                          letter-spacing:0.5px;font-weight:600">Bài thi</p>
                <p style="margin:0 0 12px;font-size:17px;font-weight:bold;color:#0c4a6e">%s</p>
                <p style="margin:0;font-size:13px;color:#0369a1">Lớp: <b>%s</b></p>
            </div>

            <!-- Time grid -->
            <table width="100%%" cellspacing="0" cellpadding="0" style="margin-bottom:24px">
                <tr>
                    <td width="32%%" style="background:#f8fafc;border:1px solid #e5e7eb;
                        border-radius:8px;padding:14px;text-align:center">
                        <div style="font-size:11px;color:#6b7280;margin-bottom:5px">Bắt đầu</div>
                        <div style="font-size:13px;font-weight:bold;color:#111">%s</div>
                    </td>
                    <td width="4%%"></td>
                    <td width="32%%" style="background:#f8fafc;border:1px solid #e5e7eb;
                        border-radius:8px;padding:14px;text-align:center">
                        <div style="font-size:11px;color:#6b7280;margin-bottom:5px">Kết thúc</div>
                        <div style="font-size:13px;font-weight:bold;color:#111">%s</div>
                    </td>
                    <td width="4%%"></td>
                    <td width="28%%" style="background:#f8fafc;border:1px solid #e5e7eb;
                        border-radius:8px;padding:14px;text-align:center">
                        <div style="font-size:11px;color:#6b7280;margin-bottom:5px">Thời gian</div>
                        <div style="font-size:13px;font-weight:bold;color:#111">%s</div>
                    </td>
                </tr>
            </table>

            <div style="text-align:center;margin-bottom:20px">
                <a href="%s/student/exams"
                   style="background:#0891b2;color:#fff;text-decoration:none;
                          padding:13px 28px;border-radius:8px;font-weight:bold;font-size:14px">
                   Vào thi ngay →</a>
            </div>
        """.formatted(baseUrl, name, examTitle, courseName, startStr, endStr, duration) + footer();
    }

    // ── Template 4: Grade Result ──────────────────────────
    private String buildGradeEmail(String name, String examTitle, String courseName,
                                   Double score, Double totalScore, Boolean passed) {
        String passedText   = Boolean.TRUE.equals(passed) ? "ĐẠT" : "CHƯA ĐẠT";
        String passedColor  = Boolean.TRUE.equals(passed) ? "#16a34a" : "#dc2626";
        String passedBg     = Boolean.TRUE.equals(passed) ? "#f0fdf4" : "#fef2f2";
        String passedBorder = Boolean.TRUE.equals(passed) ? "#bbf7d0" : "#fecaca";
        String scoreStr     = score     != null ? score.toString()     : "—";
        String totalStr     = totalScore != null ? totalScore.toString() : "10";
        String courseRow    = courseName != null
                ? "<p style='margin:4px 0 0;font-size:13px;color:#6b7280'>" + courseName + "</p>" : "";
        String headerColor  = Boolean.TRUE.equals(passed) ? "#16a34a" : "#dc2626";

        return header(headerColor, "Kết quả bài thi", "Kết quả đã có") + """
            <p style="font-size:16px;color:#111;margin:0 0 8px">Xin chào <b>%s</b>,</p>
            <p style="color:#555;font-size:14px;line-height:1.6;margin-bottom:22px">
                Bài thi của bạn đã được chấm điểm. Xem kết quả bên dưới.
            </p>
            <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;
                        padding:16px 20px;margin-bottom:20px">
                <p style="margin:0 0 4px;font-size:12px;color:#6b7280">Bài thi</p>
                <p style="margin:0;font-size:15px;font-weight:bold;color:#111">%s</p>
                %s
            </div>
            <table width="100%%" cellspacing="0" cellpadding="0" style="margin-bottom:24px">
                <tr>
                    <td width="48%%" style="text-align:center;background:#f8fafc;
                        border:1px solid #e5e7eb;border-radius:10px;padding:22px">
                        <div style="font-size:12px;color:#6b7280;margin-bottom:6px">Điểm số</div>
                        <div style="font-family:monospace;font-size:30px;font-weight:bold;color:#111">
                            %s<span style="font-size:16px;color:#9ca3af">/%s</span>
                        </div>
                    </td>
                    <td width="4%%"></td>
                    <td width="48%%" style="text-align:center;background:%s;
                        border:1px solid %s;border-radius:10px;padding:22px">
                        <div style="font-size:12px;color:#6b7280;margin-bottom:6px">Kết quả</div>
                        <div style="font-size:22px;font-weight:bold;color:%s">%s</div>
                    </td>
                </tr>
            </table>
            <div style="text-align:center;margin-bottom:20px">
                <a href="%s/student/results"
                   style="background:#4f6ef7;color:#fff;text-decoration:none;
                          padding:13px 28px;border-radius:8px;font-weight:bold;font-size:14px">
                   Xem chi tiết bài làm →</a>
            </div>
        """.formatted(
                name,
                examTitle,
                courseRow,
                scoreStr,
                totalStr,
                passedBg,
                passedBorder,
                passedColor,
                passedText,
                baseUrl
        ) + footer();
    }
}