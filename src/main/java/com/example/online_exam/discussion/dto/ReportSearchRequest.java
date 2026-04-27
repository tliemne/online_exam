package com.example.online_exam.discussion.dto;

import com.example.online_exam.discussion.enums.ReportStatus;
import com.example.online_exam.discussion.enums.ViolationType;
import lombok.Data;

@Data
public class ReportSearchRequest {
    private ReportStatus status;
    private ViolationType violationType;
    private Long courseId;
}
