package com.example.online_exam.question.service;

import com.example.online_exam.question.dto.QuestionRequest;
import com.example.online_exam.question.dto.QuestionResponse;
import com.example.online_exam.question.enums.Difficulty;
import com.example.online_exam.question.enums.QuestionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface QuestionService {
    QuestionResponse create(QuestionRequest request);
    QuestionResponse update(Long id, QuestionRequest request);
    void delete(Long id);
    QuestionResponse getById(Long id);
    List<QuestionResponse> getByCourse(Long courseId);
    List<QuestionResponse> search(Long courseId, QuestionType type, Difficulty difficulty, String keyword);
    Page<QuestionResponse> searchPaged(Long courseId, QuestionType type, Difficulty difficulty, String keyword, Pageable pageable);
}