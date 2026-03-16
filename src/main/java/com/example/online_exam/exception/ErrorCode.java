package com.example.online_exam.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // ===== USER =====
    USERNAME_EXISTS(HttpStatus.BAD_REQUEST, "Username đã tồn tại"),
    EMAIL_EXISTS(HttpStatus.BAD_REQUEST, "Email đã tồn tại"),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "User không tồn tại"),
    INVALID_PASSWORD(HttpStatus.BAD_REQUEST, "Mật khẩu không đúng"),
    ROLE_NOT_FOUND(HttpStatus.NOT_FOUND, "Role không tồn tại"),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "Token đã hết hạn"),
    COURSE_NOT_FOUND(HttpStatus.NOT_FOUND, "Course không tồn tại"),
    INVALID_TEACHER(HttpStatus.BAD_REQUEST, "Giáo viên không hợp lệ"),

    // ===== AUTH =====
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Unauthorized"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "Access denied"),
    TOKEN_INVALID(HttpStatus.UNAUTHORIZED, "Token không hợp lệ"),

    // ===== REQUEST =====
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "Yêu cầu không hợp lệ"),
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Dữ liệu không hợp lệ"),

    // ===== QUESTION =====
    QUESTION_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy câu hỏi"),
    QUESTION_IN_USE(HttpStatus.BAD_REQUEST, "Câu hỏi đang được dùng trong đề thi, không thể xóa. Hãy gỡ khỏi đề thi trước!"),
    ALREADY_SUBMITTED(HttpStatus.BAD_REQUEST, "Bài thi đã được nộp trước đó"),
    TAG_NOT_FOUND(HttpStatus.NOT_FOUND, "Tag không tồn tại"),
    TAG_ALREADY_EXISTS(HttpStatus.BAD_REQUEST, "Tag đã tồn tại"),


    // ===== MODULES =====
    EXAM_NOT_FOUND(HttpStatus.NOT_FOUND, "Bài thi không tồn tại"),
    LECTURE_NOT_FOUND(HttpStatus.NOT_FOUND, "Bài giảng không tồn tại"),
    // ===== ATTEMPT =====
    ATTEMPT_NOT_FOUND(HttpStatus.NOT_FOUND, "Bài làm không tồn tại"),
    EXAM_ALREADY_ATTEMPTED(HttpStatus.BAD_REQUEST, "Bạn đã làm bài thi này rồi, không thể làm lại."),

    // ===== SYSTEM =====
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error"),

    // ===== RATE LIMIT =====
    TOO_MANY_LOGIN_ATTEMPTS(HttpStatus.TOO_MANY_REQUESTS, "Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau."),

    // ===== USER =====
    CANNOT_DELETE_SELF(HttpStatus.BAD_REQUEST, "Không thể xóa tài khoản đang đăng nhập."),

    // ===== GENERIC =====
    NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}