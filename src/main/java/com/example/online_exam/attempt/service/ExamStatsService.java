package com.example.online_exam.attempt.service;

import com.example.online_exam.attempt.dto.ExamStatsResponse;

public interface ExamStatsService {
    ExamStatsResponse getExamStats(Long examId);
}