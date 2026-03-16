package com.example.online_exam.attempt.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data @Builder
public class AiExplanationResponse {
    private Long   attemptAnswerId;
    private Long   questionId;
    private String questionContent;
    private String yourAnswer;
    private String correctAnswer;
    private String explanation;
    private String tip;

    @Data @Builder
    public static class Summary {
        private List<AiExplanationResponse> explanations;
        private String                       overallFeedback; // nhận xét chung
        private List<String>                 weakTopics;      // chủ đề cần ôn
    }
}