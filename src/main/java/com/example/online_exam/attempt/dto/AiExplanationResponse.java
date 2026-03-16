package com.example.online_exam.attempt.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data @Builder
public class AiExplanationResponse {
    private Long   attemptAnswerId;
    private Long   questionId;
    private String questionContent;   // câu hỏi gốc
    private String yourAnswer;        // đáp án student chọn
    private String correctAnswer;     // đáp án đúng
    private String explanation;       // AI giải thích
    private String tip;               // gợi ý ghi nhớ ngắn

    @Data @Builder
    public static class Summary {
        private List<AiExplanationResponse> explanations;
        private String                       overallFeedback; // nhận xét chung
        private List<String>                 weakTopics;      // chủ đề cần ôn
    }
}