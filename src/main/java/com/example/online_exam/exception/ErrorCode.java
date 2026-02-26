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

    // ===== SYSTEM =====
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}
