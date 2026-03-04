package com.example.online_exam.question.dto;

import lombok.Data;

@Data
public class AnswerResponse {
    private Long id;
    private String content;
    private boolean correct;
}