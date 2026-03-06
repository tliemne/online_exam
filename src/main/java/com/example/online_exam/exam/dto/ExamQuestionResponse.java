package com.example.online_exam.exam.dto;

import com.example.online_exam.question.enums.Difficulty;
import com.example.online_exam.question.enums.QuestionType;
import lombok.Data;
import java.util.List;

@Data
public class ExamQuestionResponse {
    private Long id;
    private Long questionId;
    private String content;
    private QuestionType type;
    private Difficulty difficulty;
    private Double score;
    private Integer orderIndex;
    private List<AnswerInExam> answers; // Không lộ correct khi student thi

    @Data
    public static class AnswerInExam {
        private Long id;
        private String content;
        private Boolean correct; // null khi student thi, có giá trị khi teacher xem
    }
}