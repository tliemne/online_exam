package com.example.online_exam.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // ===== USER =====
    USERNAME_EXISTS(HttpStatus.BAD_REQUEST, "Username already exists"),
    EMAIL_EXISTS(HttpStatus.BAD_REQUEST, "Email already exists"),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "User not found"),
    INVALID_PASSWORD(HttpStatus.BAD_REQUEST, "Invalid password"),
    ROLE_NOT_FOUND(HttpStatus.NOT_FOUND, "Role not found"),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "Token expired"),
    COURSE_NOT_FOUND(HttpStatus.NOT_FOUND, "Course not found"),
    INVALID_TEACHER(HttpStatus.BAD_REQUEST, "Assigned user is not a teacher"),

    // ===== AUTH =====
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Unauthorized"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "Access denied"),
    TOKEN_INVALID(HttpStatus.UNAUTHORIZED, "Token invalid"),

    // ===== REQUEST =====
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "Invalid request data"),
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Validation failed"),

    // ===== QUESTION =====
    QUESTION_NOT_FOUND(HttpStatus.NOT_FOUND, "Question not found"),
    QUESTION_IN_USE(HttpStatus.BAD_REQUEST, "Câu hỏi đang được dùng trong đề thi, không thể xóa. Hãy gỡ khỏi đề thi trước!"),
    ALREADY_SUBMITTED(HttpStatus.BAD_REQUEST, "Bài thi đã được nộp trước đó"),
    TAG_NOT_FOUND(HttpStatus.NOT_FOUND, "Tag không tồn tại"),
    TAG_ALREADY_EXISTS(HttpStatus.BAD_REQUEST, "Tag đã tồn tại"),


    // ===== MODULES =====
    EXAM_NOT_FOUND(HttpStatus.NOT_FOUND, "Exam not found"),
    LECTURE_NOT_FOUND(HttpStatus.NOT_FOUND, "Lecture not found"),
    // ===== ATTEMPT =====
    ATTEMPT_NOT_FOUND(HttpStatus.NOT_FOUND, "Attempt not found"),
    EXAM_ALREADY_ATTEMPTED(HttpStatus.BAD_REQUEST, "Exam already attempted"),

    // ===== SYSTEM =====
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error"),

    // ===== RATE LIMIT =====
    TOO_MANY_LOGIN_ATTEMPTS(HttpStatus.TOO_MANY_REQUESTS, "Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau."),

    // ===== USER =====
    CANNOT_DELETE_SELF(HttpStatus.BAD_REQUEST, "Không thể xóa tài khoản đang đăng nhập."),

    // ===== GENERIC =====
    NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy"),

    AI_QUOTA_EXCEEDED(HttpStatus.TOO_MANY_REQUESTS, "Quota AI đã hết cho hôm nay. Vui lòng thử lại vào ngày mai hoặc đổi API key.");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}