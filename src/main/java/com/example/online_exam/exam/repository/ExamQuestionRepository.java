package com.example.online_exam.exam.repository;

import com.example.online_exam.exam.entity.ExamQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExamQuestionRepository extends JpaRepository<ExamQuestion, Long> {
    List<ExamQuestion> findByExamIdOrderByOrderIndex(Long examId);
    boolean existsByExamIdAndQuestionId(Long examId, Long questionId);
    void deleteByExamIdAndQuestionId(Long examId, Long questionId);
    int countByExamId(Long examId);
}