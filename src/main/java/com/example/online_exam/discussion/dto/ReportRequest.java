package com.example.online_exam.discussion.dto;

import com.example.online_exam.discussion.enums.ViolationType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReportRequest {
    @NotNull(message = "Loại vi phạm là bắt buộc")
    private ViolationType violationType;
    
    @Size(max = 500, message = "Chi tiết không được vượt quá 500 ký tự")
    private String details;
}
