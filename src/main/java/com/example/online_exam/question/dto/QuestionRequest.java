package com.example.online_exam.question.dto;

import com.example.online_exam.question.enums.Difficulty;
import com.example.online_exam.question.enums.QuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class QuestionRequest {
    @NotBlank
    private String content;

    @NotNull
    private QuestionType type;

    private Difficulty difficulty = Difficulty.MEDIUM;

    @NotNull
    private Long courseId;

    private List<AnswerRequest> answers;
}