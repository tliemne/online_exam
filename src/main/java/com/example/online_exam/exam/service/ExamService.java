package com.example.online_exam.exam.service;

import com.example.online_exam.exam.dto.*;
import com.example.online_exam.exam.enums.ExamStatus;

import java.util.List;

public interface ExamService {
    ExamResponse create(ExamRequest request);
    ExamResponse update(Long id, ExamRequest request);
    void delete(Long id);
    ExamResponse getById(Long id, boolean includeQuestions, boolean hideCorrect);
    List<ExamResponse> getAll();
    List<ExamResponse> getByCourse(Long courseId);
    List<ExamResponse> getForStudent(Long studentId);

    // Quản lý câu hỏi trong đề
    ExamResponse addQuestion(Long examId, ExamQuestionItem item);
    ExamResponse addQuestions(Long examId, List<ExamQuestionItem> items);
    ExamResponse removeQuestion(Long examId, Long questionId);
    ExamResponse reorderQuestions(Long examId, List<ExamQuestionItem> items);

    // Publish / Close
    ExamResponse publish(Long id);
    ExamResponse close(Long id);
}