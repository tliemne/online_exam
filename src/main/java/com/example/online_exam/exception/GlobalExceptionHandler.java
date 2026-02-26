package com.example.online_exam.exception;

import com.example.online_exam.common.dto.BaseResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AppException.class)
    public ResponseEntity<BaseResponse<?>> handleAppException(AppException ex) {

        ErrorCode code = ex.getErrorCode();

        BaseResponse<?> response = BaseResponse.builder()
                .status(code.getStatus().value())
                .message(code.getMessage())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.status(code.getStatus()).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<BaseResponse<?>> handleUnknown(Exception ex) {

        BaseResponse<?> response = BaseResponse.builder()
                .status(500)
                .message("Internal Server Error")
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.internalServerError().body(response);
    }
}