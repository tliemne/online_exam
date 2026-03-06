package com.example.online_exam.attempt.dto;

import lombok.Data;
import java.util.List;

@Data
public class GradeRequest {
    private List<AnswerGrade> answers;

    @Data
    public static class AnswerGrade {
        private Long attemptAnswerId;
        private Double score;
        private Boolean isCorrect;
        private String teacherComment;
    }
}