package com.example.online_exam.question.dto;

import com.example.online_exam.question.enums.Difficulty;
import com.example.online_exam.question.enums.QuestionType;
import lombok.Data;

import java.util.List;

/**
 * Mỗi row trong file Excel/CSV map thành object này.
 */
@Data
public class QuestionImportRequest {
    private String content;
    private QuestionType type;         // MULTIPLE_CHOICE | TRUE_FALSE | ESSAY
    private Difficulty difficulty;     // EASY | MEDIUM | HARD
    private List<AnswerRequest> answers;
}




















