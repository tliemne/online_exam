package com.example.online_exam.attempt.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiSuggestionResponse {
    private Long   attemptAnswerId;
    private Double suggestedScore;
    private String confidence;   // HIGH | MEDIUM | LOW
    private String comment;
}