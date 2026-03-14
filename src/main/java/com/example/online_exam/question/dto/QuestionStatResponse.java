package com.example.online_exam.question.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QuestionStatResponse {
    private Long questionId;
    private String questionContent;
    private String questionType;
    private String difficulty;

    private int totalAttempts;
    private int correctCount;
    private double correctRate;      // 0.0 – 1.0
    private String difficultyFlag;   // OK / TOO_EASY / TOO_HARD
}