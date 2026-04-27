package com.example.online_exam.discussion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ModerationActionRequest {
    @NotBlank(message = "Lý do là bắt buộc")
    @Size(min = 10, max = 500, message = "Lý do phải từ 10 đến 500 ký tự")
    private String reason;
    
    private Integer muteDurationDays;
}
