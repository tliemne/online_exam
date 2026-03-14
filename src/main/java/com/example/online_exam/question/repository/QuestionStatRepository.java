package com.example.online_exam.question.repository;

import com.example.online_exam.question.entity.QuestionStat;
import org.springframework.data.jpa.repository.JpaRepository;
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
}