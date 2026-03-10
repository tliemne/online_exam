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
            <head><meta charset="UTF-8"/></head>
            <body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px">
              <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">

                <!-- Header -->
                <div style="background:linear-gradient(135deg,#6c63ff,#4f46e5);padding:32px 32px 24px;text-align:center">
                  <h1 style="color:#fff;margin:0;font-size:24px">📋 ExamPortal</h1>
                  <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px">Hệ thống thi trực tuyến</p>
                </div>

                <!-- Body -->
                <div style="padding:32px">
                  <p style="color:#333;font-size:16px;margin:0 0 8px">Xin chào <strong>%s</strong>,</p>
                  <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 24px">
                    Tài khoản ExamPortal của bạn đã được tạo%s. Dưới đây là thông tin đăng nhập:
                  </p>

                  <!-- Credentials box -->
                  <div style="background:#f8f7ff;border:1px solid #e0deff;border-radius:8px;padding:20px;margin-bottom:24px">
                    <table style="width:100%;border-collapse:collapse">
                      <tr>
                        <td style="color:#888;font-size:13px;padding:6px 0">Tên đăng nhập</td>
                        <td style="font-family:monospace;font-size:15px;font-weight:bold;color:#4f46e5;text-align:right">%s</td>
                      </tr>
                      <tr>
                        <td style="color:#888;font-size:13px;padding:6px 0;border-top:1px solid #e0deff">Mật khẩu</td>
                        <td style="font-family:monospace;font-size:15px;font-weight:bold;color:#e11d48;text-align:right;border-top:1px solid #e0deff">%s</td>
                      </tr>
                    </table>
                  </div>

                  <div style="background:#fff8f0;border-left:3px solid #f59e0b;padding:12px 16px;border-radius:4px;margin-bottom:24px">
                    <p style="color:#92400e;font-size:13px;margin:0">
                      ⚠ Vui lòng giữ bí mật thông tin này. Bạn có thể đổi mật khẩu sau khi đăng nhập trong phần <strong>Hồ sơ cá nhân</strong>.
                    </p>
                  </div>

                  <a href="http://localhost:3000/login"
                    style="display:block;background:#4f46e5;color:#fff;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px">
                    🚀 Đăng nhập ngay
                  </a>
                </div>

                <!-- Footer -->
                <div style="background:#f8f8f8;padding:16px 32px;text-align:center;border-top:1px solid #eee">
                  <p style="color:#aaa;font-size:12px;margin:0">ExamPortal · Hệ thống thi trực tuyến</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(
                name,
                courseName != null ? " và đã được thêm vào lớp <strong>" + courseName + "</strong>" : "",
                username,
                password
        );
    }

    private String buildResetEmail(String name, String newPassword) {
        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head><meta charset="UTF-8"/></head>
            <body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px">
              <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
                <div style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:32px;text-align:center">
                  <h1 style="color:#fff;margin:0;font-size:24px">🔐 ExamPortal</h1>
                  <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px">Đặt lại mật khẩu</p>
                </div>
                <div style="padding:32px">
                  <p style="color:#333;font-size:16px">Xin chào <strong>%s</strong>,</p>
                  <p style="color:#666;font-size:14px;line-height:1.6">Mật khẩu của bạn vừa được đặt lại bởi quản trị viên.</p>
                  <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;margin:20px 0;text-align:center">
                    <p style="color:#888;font-size:13px;margin:0 0 8px">Mật khẩu mới của bạn</p>
                    <p style="font-family:monospace;font-size:22px;font-weight:bold;color:#dc2626;margin:0;letter-spacing:2px">%s</p>
                  </div>
                  <div style="background:#fff8f0;border-left:3px solid #f59e0b;padding:12px 16px;border-radius:4px;margin-bottom:24px">
                    <p style="color:#92400e;font-size:13px;margin:0">⚠ Hãy đổi mật khẩu ngay sau khi đăng nhập để bảo mật tài khoản.</p>
                  </div>
                  <a href="http://localhost:3000/login"
                    style="display:block;background:#dc2626;color:#fff;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold">
                    🔑 Đăng nhập với mật khẩu mới
                  </a>
                </div>
                <div style="background:#f8f8f8;padding:16px 32px;text-align:center;border-top:1px solid #eee">
                  <p style="color:#aaa;font-size:12px;margin:0">ExamPortal · Hệ thống thi trực tuyến</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(name, newPassword);
    }
}