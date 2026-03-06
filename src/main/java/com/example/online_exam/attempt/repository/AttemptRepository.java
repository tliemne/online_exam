package com.example.online_exam.attempt.repository;

import com.example.online_exam.attempt.entity.Attempt;

import com.example.online_exam.attempt.enums.AttemptStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AttemptRepository extends JpaRepository<Attempt, Long> {

    // Số lần student đã nộp bài cho exam này
    long countByExamIdAndStudentId(Long examId, Long studentId);

    // Lấy bài làm đang dở (IN_PROGRESS)
    Optional<Attempt> findByExamIdAndStudentIdAndStatus(Long examId, Long studentId, AttemptStatus status);

    // Tất cả bài làm của student cho 1 exam
    List<Attempt> findByExamIdAndStudentIdOrderByStartedAtDesc(Long examId, Long studentId);

    // Teacher xem tất cả bài nộp của 1 exam
    List<Attempt> findByExamIdOrderBySubmittedAtDesc(Long examId);

    // Student xem tất cả bài đã nộp
    @Query("""
        SELECT a FROM Attempt a
        WHERE a.student.id = :studentId
          AND a.status IN ('SUBMITTED','GRADED')
        ORDER BY a.submittedAt DESC
    """)
    List<Attempt> findSubmittedByStudent(@Param("studentId") Long studentId);
}