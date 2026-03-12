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
    private QuestionType type;
    private Difficulty difficulty;
    private List<AnswerRequest> answers;
    /** Tên các tag, cách nhau bằng dấu phẩy (trong file) hoặc là List (trong JSON) */
    private List<String> tagNames;
}