package com.example.online_exam.attempt.repository;

import com.example.online_exam.attempt.entity.Attempt;
import com.example.online_exam.attempt.enums.AttemptStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    // Query 1: fetch exam + examQuestions (không fetch answers cùng lúc — Hibernate không cho)
    @Query("SELECT a FROM Attempt a " +
            "LEFT JOIN FETCH a.exam e " +
            "LEFT JOIN FETCH e.examQuestions eq " +
            "LEFT JOIN FETCH eq.question " +
            "WHERE a.id = :id")
    Optional<Attempt> findByIdWithExam(@Param("id") Long id);

    // Query 2: fetch answers (riêng biệt)
    @Query("SELECT a FROM Attempt a " +
            "LEFT JOIN FETCH a.answers aa " +
            "LEFT JOIN FETCH aa.question " +
            "WHERE a.id = :id")
    Optional<Attempt> findByIdWithAnswers(@Param("id") Long id);

    // Xóa toàn bộ bài thi của 1 student (dùng khi xóa tài khoản)
    @Modifying
    @Query("DELETE FROM Attempt a WHERE a.student.id = :studentId")
    void deleteByStudentId(@Param("studentId") Long studentId);
    @Modifying
    @Query("DELETE FROM Attempt a WHERE a.exam.id = :examId")
    void deleteByExamId(@Param("examId") Long examId);

    @Modifying
    @Query(value = "DELETE a FROM attempts a JOIN exams e ON e.id = a.exam_id WHERE e.created_by = :userId", nativeQuery = true)
    void deleteByExamCreatedById(@Param("userId") Long userId);
}