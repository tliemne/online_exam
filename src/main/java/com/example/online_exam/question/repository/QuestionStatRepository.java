package com.example.online_exam.question.repository;

import com.example.online_exam.question.entity.QuestionStat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface QuestionStatRepository extends JpaRepository<QuestionStat, Long> {

    Optional<QuestionStat> findByQuestionId(Long questionId);

    /** Lấy stats theo course — dùng cho teacher xem báo cáo */
    @Query("SELECT qs FROM QuestionStat qs WHERE qs.question.course.id = :courseId ORDER BY qs.correctRate ASC")
    List<QuestionStat> findByCourseId(@Param("courseId") Long courseId);

    /** Lấy các câu bị flag — TOO_HARD hoặc TOO_EASY */
    @Query("SELECT qs FROM QuestionStat qs WHERE qs.question.course.id = :courseId AND qs.difficultyFlag != 'OK'")
    List<QuestionStat> findFlaggedByCourseId(@Param("courseId") Long courseId);

    /** Native SQL update — tránh optimistic locking khi nhiều transaction cùng update */
    @Modifying
    @Query(value = """
        UPDATE question_statistics 
        SET total_attempts = total_attempts + 1,
            correct_count = correct_count + :correctIncrement,
            correct_rate = (correct_count + :correctIncrement) / (total_attempts + 1),
            difficulty_flag = CASE 
                WHEN (correct_count + :correctIncrement) / (total_attempts + 1) >= 0.85 THEN 'TOO_EASY'
                WHEN (correct_count + :correctIncrement) / (total_attempts + 1) <= 0.30 THEN 'TOO_HARD'
                ELSE 'OK'
            END
        WHERE question_id = :questionId
    """, nativeQuery = true)
    void incrementStats(@Param("questionId") Long questionId, @Param("correctIncrement") int correctIncrement);

    /** Native SQL insert — tạo stat mới bằng SQL thay vì JPA save */
    @Modifying
    @Query(value = """
        INSERT INTO question_statistics (question_id, total_attempts, correct_count, correct_rate, difficulty_flag)
        VALUES (:questionId, :totalAttempts, :correctCount, :correctRate, :difficultyFlag)
        ON DUPLICATE KEY UPDATE
            total_attempts = total_attempts + 1,
            correct_count = correct_count + :correctCount,
            correct_rate = (correct_count + :correctCount) / (total_attempts + 1),
            difficulty_flag = CASE 
                WHEN (correct_count + :correctCount) / (total_attempts + 1) >= 0.85 THEN 'TOO_EASY'
                WHEN (correct_count + :correctCount) / (total_attempts + 1) <= 0.30 THEN 'TOO_HARD'
                ELSE 'OK'
            END
    """, nativeQuery = true)
    void createNewStat(@Param("questionId") Long questionId, @Param("totalAttempts") int totalAttempts,
                       @Param("correctCount") int correctCount, @Param("correctRate") double correctRate,
                       @Param("difficultyFlag") String difficultyFlag);
}