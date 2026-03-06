package com.example.online_exam.exam.dto;

import lombok.Data;

@Data
public class ExamQuestionItem {
    private Long questionId;
    private Double score;
    private Integer orderIndex;
}