package com.example.online_exam.exam.repository;

import com.example.online_exam.exam.entity.ExamQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ExamQuestionRepository extends JpaRepository<ExamQuestion, Long> {
    List<ExamQuestion> findByExamIdOrderByOrderIndex(Long examId);
    boolean existsByExamIdAndQuestionId(Long examId, Long questionId);
    long countByQuestionId(Long questionId);
    int countByExamId(Long examId);

    @Modifying
    @Query(value = "DELETE FROM exam_questions WHERE exam_id = :examId AND question_id = :questionId", nativeQuery = true)
    void deleteByExamIdAndQuestionId(@Param("examId") Long examId, @Param("questionId") Long questionId);

    @Modifying
    @Query(value = "DELETE FROM exam_questions WHERE exam_id = :examId", nativeQuery = true)
    void deleteByExamId(@Param("examId") Long examId);

    @Modifying
    @Query(value = "DELETE FROM exam_questions WHERE question_id = :questionId", nativeQuery = true)
    void deleteByQuestionId(@Param("questionId") Long questionId);

    // Xóa exam_questions của tất cả exam do 1 user tạo (dùng khi xóa teacher)
    @Modifying
    @Query(value = "DELETE eq FROM exam_questions eq JOIN exams e ON e.id = eq.exam_id WHERE e.created_by = :userId", nativeQuery = true)
    void deleteByExamCreatedById(@Param("userId") Long userId);

    // Xóa exam_questions trỏ đến questions của 1 user tạo
    @Modifying
    @Query(value = "DELETE eq FROM exam_questions eq JOIN questions q ON q.id = eq.question_id WHERE q.created_by = :userId", nativeQuery = true)
    void deleteByQuestionCreatedById(@Param("userId") Long userId);
}