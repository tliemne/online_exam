package com.example.online_exam.attempt.repository;

import com.example.online_exam.attempt.entity.Attempt;
import com.example.online_exam.attempt.enums.AttemptStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AttemptRepository extends JpaRepository<Attempt, Long> {

    // Đếm bài SUBMITTED (chờ chấm) theo examId
    @Query("SELECT COUNT(a) FROM Attempt a WHERE a.exam.id = :examId AND a.status = 'SUBMITTED'")
    long countPendingByExamId(@Param("examId") Long examId);

    // Số lần student đã HOÀN THÀNH (SUBMITTED + GRADED), không tính IN_PROGRESS
    @Query("SELECT COUNT(a) FROM Attempt a WHERE a.exam.id = :examId AND a.student.id = :studentId AND a.status <> 'IN_PROGRESS'")
    long countByExamIdAndStudentId(@Param("examId") Long examId, @Param("studentId") Long studentId);

    // Lấy bài làm đang dở MỚI NHẤT (tránh lỗi khi có nhiều row IN_PROGRESS)
    @Query("SELECT a FROM Attempt a WHERE a.exam.id = :examId AND a.student.id = :studentId AND a.status = :status ORDER BY a.startedAt DESC")
    List<Attempt> findAllByExamIdAndStudentIdAndStatus(@Param("examId") Long examId, @Param("studentId") Long studentId, @Param("status") AttemptStatus status);

    // Tất cả bài làm của student cho 1 exam
    List<Attempt> findByExamIdAndStudentIdOrderByStartedAtDesc(Long examId, Long studentId);

    // Teacher xem tất cả bài nộp của 1 exam (chỉ đã nộp, không hiện IN_PROGRESS)
    @Query("SELECT a FROM Attempt a WHERE a.exam.id = :examId AND a.status <> 'IN_PROGRESS' ORDER BY a.submittedAt DESC")
    List<Attempt> findByExamIdOrderBySubmittedAtDesc(@Param("examId") Long examId);

    // Student xem tất cả bài đã nộp
    @Query("""
        SELECT a FROM Attempt a
        WHERE a.student.id = :studentId
          AND a.status IN ('SUBMITTED','GRADED')
        ORDER BY a.submittedAt DESC
    """)
    List<Attempt> findSubmittedByStudent(@Param("studentId") Long studentId);

    // Query 1: fetch exam + examQuestions
    @Query("SELECT a FROM Attempt a " +
            "LEFT JOIN FETCH a.exam e " +
            "LEFT JOIN FETCH e.examQuestions eq " +
            "LEFT JOIN FETCH eq.question " +
            "WHERE a.id = :id")
    Optional<Attempt> findByIdWithExam(@Param("id") Long id);

    // Query 2: fetch answers + question (KHÔNG fetch q.answers — tránh MultipleBagFetchException)
    @Query("SELECT a FROM Attempt a " +
            "LEFT JOIN FETCH a.answers aa " +
            "LEFT JOIN FETCH aa.question q " +
            "WHERE a.id = :id")
    Optional<Attempt> findByIdWithAnswers(@Param("id") Long id);

    // Query 3: fetch question.answers riêng (dùng khi cần correctAnswer)
    @Query("SELECT a FROM Attempt a " +
            "LEFT JOIN FETCH a.answers aa " +
            "LEFT JOIN FETCH aa.question q " +
            "LEFT JOIN FETCH q.answers " +
            "WHERE a.id = :id")
    Optional<Attempt> findByIdWithAnswersAndOptions(@Param("id") Long id);


    // ── Stats queries ───────────────────────────────────────────────────────

    // Tất cả attempt GRADED/SUBMITTED của 1 exam (có score) — fetch student + profile luôn
    @Query("SELECT a FROM Attempt a " +
            "LEFT JOIN FETCH a.student s " +
            "LEFT JOIN FETCH s.studentProfile " +
            "WHERE a.exam.id = :examId " +
            "  AND a.status IN ('SUBMITTED','GRADED') " +
            "  AND a.score IS NOT NULL " +
            "ORDER BY a.score DESC")
    List<Attempt> findGradedByExam(@Param("examId") Long examId);

    // Avg score per question cho 1 exam
    @Query(value = """
        SELECT aa.question_id,
               COUNT(aa.id)                                          AS total,
               SUM(CASE WHEN aa.is_correct = 1 THEN 1 ELSE 0 END)  AS correct_count,
               AVG(COALESCE(aa.score, 0))                           AS avg_score
        FROM attempt_answers aa
        JOIN attempts a ON a.id = aa.attempt_id
        WHERE a.exam_id = :examId
          AND a.status IN ('SUBMITTED','GRADED')
        GROUP BY aa.question_id
    """, nativeQuery = true)
    List<Object[]> findQuestionStatsByExam(@Param("examId") Long examId);


    // Load question options cho tất cả câu trong 1 attempt (tránh N+1)
    @Query("SELECT DISTINCT q FROM Question q " +
            "LEFT JOIN FETCH q.answers " +
            "WHERE q.id IN (" +
            "  SELECT aa.question.id FROM AttemptAnswer aa WHERE aa.attempt.id = :attemptId" +
            ")")
    List<com.example.online_exam.question.entity.Question> findQuestionsWithAnswersByAttemptId(
            @Param("attemptId") Long attemptId);

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