package com.example.online_exam.question.dto;

import com.example.online_exam.question.enums.Difficulty;
import com.example.online_exam.question.enums.QuestionType;
import com.example.online_exam.tag.dto.TagResponse;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class QuestionResponse {
    private Long id;
    private String content;
    private QuestionType type;
    private Difficulty difficulty;
    private Long courseId;
    private String courseName;
    private String createdByName;
    private List<AnswerResponse> answers;
    private LocalDateTime createdAt;
    private List<TagResponse> tags;
}