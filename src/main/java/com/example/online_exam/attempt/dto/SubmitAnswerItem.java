package com.example.online_exam.attempt.dto;

import lombok.Data;

@Data
public class SubmitAnswerItem {
    private Long questionId;
    private Long answerId;
    private String textAnswer;
}