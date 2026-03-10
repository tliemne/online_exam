package com.example.online_exam.common.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.mail.from-name:ExamPortal}")
    private String fromName;

    // Gửi async — không block luồng chính
    // @Async  ← tạm bỏ để debug, bật lại sau khi email hoạt động
    public void sendStudentCredentials(String toEmail, String studentName,
                                       String username, String plainPassword,
                                       String courseName) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject("[ExamPortal] Thông tin tài khoản của bạn");
            helper.setText(buildCredentialsEmail(studentName, username, plainPassword, courseName), true);

            mailSender.send(msg);
            log.info("✅ Email sent to {}", toEmail);

        } catch (Exception e) {
            log.error("❌ Failed to send email to {} — {}: {}", toEmail, e.getClass().getSimpleName(), e.getMessage());
            // In stack trace đầy đủ để debug
            log.error("Stack trace:", e);
        }
    }

    // @Async
    public void sendPasswordReset(String toEmail, String fullName, String newPassword) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject("[ExamPortal] Mật khẩu của bạn đã được đặt lại");
            helper.setText(buildResetEmail(fullName, newPassword), true);

            mailSender.send(msg);
            log.info("✅ Password reset email sent to {}", toEmail);

        } catch (Exception e) {
            log.error("❌ Failed to send reset email to {} — {}: {}", toEmail, e.getClass().getSimpleName(), e.getMessage());
            log.error("Stack trace:", e);
        }
    }

    // ── HTML templates ────────────────────────────────────

    private String buildCredentialsEmail(String name, String username,
                                         String password, String courseName) {
        return """
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8"/>
        </head>
        <body style="margin:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif">

        <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:14px;
                    box-shadow:0 6px 20px rgba(0,0,0,0.08);overflow:hidden">

            <!-- Header -->
            <div style="background:#4f46e5;padding:28px;text-align:center">
                <h2 style="color:#ffffff;margin:0;font-size:22px">
                    ExamPortal
                </h2>
                <p style="color:#e0e7ff;margin-top:6px;font-size:13px">
                    Hệ thống thi trực tuyến
                </p>
            </div>

            <!-- Content -->
            <div style="padding:32px">

                <p style="font-size:16px;color:#111;margin:0 0 10px">
                    Xin chào <b>%s</b>,
                </p>

                <p style="color:#555;font-size:14px;line-height:1.6;margin-bottom:24px">
                    Tài khoản của bạn trên hệ thống <b>ExamPortal</b> đã được tạo%s.
                    Vui lòng sử dụng thông tin dưới đây để đăng nhập.
                </p>

                <!-- Credentials -->
                <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:26px">

                    <div style="margin-bottom:12px">
                        <div style="font-size:12px;color:#6b7280">Tên đăng nhập</div>
                        <div style="font-family:monospace;font-size:15px;font-weight:bold;color:#111">%s</div>
                    </div>

                    <div>
                        <div style="font-size:12px;color:#6b7280">Mật khẩu</div>
                        <div style="font-family:monospace;font-size:15px;font-weight:bold;color:#ef4444">%s</div>
                    </div>

                </div>

                <!-- Button -->
                <div style="text-align:center;margin-bottom:26px">
                    <a href="http://localhost:3000/login"
                       style="background:#4f46e5;color:#ffffff;text-decoration:none;
                       padding:14px 26px;border-radius:8px;font-weight:bold;font-size:14px;
                       display:inline-block">
                       Đăng nhập hệ thống
                    </a>
                </div>

                <!-- Warning -->
                <div style="background:#fff7ed;border:1px solid #fed7aa;padding:14px;border-radius:8px">
                    <p style="margin:0;font-size:13px;color:#9a3412">
                        Vì lý do bảo mật, bạn nên đổi mật khẩu sau khi đăng nhập lần đầu.
                    </p>
                </div>

            </div>

            <!-- Footer -->
            <div style="background:#f9fafb;padding:18px;text-align:center;border-top:1px solid #eee">
                <p style="font-size:12px;color:#9ca3af;margin:0">
                    © 2026 ExamPortal. All rights reserved.
                </p>
            </div>

        </div>

        </body>
        </html>
        """.formatted(
                name,
                courseName != null ? " và đã được thêm vào lớp <b>" + courseName + "</b>" : "",
                username,
                password
        );
    }

    private String buildResetEmail(String name, String newPassword) {
        return """
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8"/>
        </head>

        <body style="margin:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif">

        <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:14px;
                    box-shadow:0 6px 20px rgba(0,0,0,0.08);overflow:hidden">

            <!-- Header -->
            <div style="background:#dc2626;padding:28px;text-align:center">
                <h2 style="color:#ffffff;margin:0;font-size:22px">
                    ExamPortal
                </h2>
                <p style="color:#fee2e2;margin-top:6px;font-size:13px">
                    Đặt lại mật khẩu
                </p>
            </div>

            <!-- Content -->
            <div style="padding:32px">

                <p style="font-size:16px;color:#111">
                    Xin chào <b>%s</b>,
                </p>

                <p style="font-size:14px;color:#555;line-height:1.6">
                    Mật khẩu của bạn đã được quản trị viên đặt lại.
                </p>

                <!-- Password Box -->
                <div style="margin:24px 0;background:#fef2f2;border:1px solid #fecaca;
                            border-radius:10px;padding:24px;text-align:center">

                    <div style="font-size:12px;color:#7f1d1d;margin-bottom:6px">
                        Mật khẩu mới
                    </div>

                    <div style="font-family:monospace;font-size:22px;
                                font-weight:bold;color:#dc2626;letter-spacing:2px">
                        %s
                    </div>

                </div>

                <div style="text-align:center;margin-bottom:20px">
                    <a href="http://localhost:3000/login"
                       style="background:#dc2626;color:#fff;text-decoration:none;
                       padding:14px 26px;border-radius:8px;font-weight:bold;font-size:14px">
                       Đăng nhập ngay
                    </a>
                </div>

                <div style="background:#fff7ed;border:1px solid #fed7aa;padding:14px;border-radius:8px">
                    <p style="margin:0;font-size:13px;color:#9a3412">
                        Hãy đổi mật khẩu ngay sau khi đăng nhập để đảm bảo an toàn tài khoản.
                    </p>
                </div>

            </div>

            <div style="background:#f9fafb;padding:18px;text-align:center;border-top:1px solid #eee">
                <p style="font-size:12px;color:#9ca3af;margin:0">
                    © 2026 ExamPortal. All rights reserved.
                </p>
            </div>

        </div>

        </body>
        </html>
        """.formatted(name, newPassword);
    }
}