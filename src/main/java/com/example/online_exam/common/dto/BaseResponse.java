package com.example.online_exam.common.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BaseResponse<T> {

    private int status;
    private String message;
    private T data;
    private LocalDateTime timestamp;

}