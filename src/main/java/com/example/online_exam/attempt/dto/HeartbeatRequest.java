package com.example.online_exam.attempt.dto;

import lombok.Data;
import java.util.List;

@Data
public class HeartbeatRequest {
    private int timeRemainingSeconds;
    private int tabViolationCount;
    private List<SubmitAnswerItem> answers; // câu trả lời tạm thời
}