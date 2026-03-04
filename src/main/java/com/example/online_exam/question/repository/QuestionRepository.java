package com.example.online_exam.question.repository;

import com.example.online_exam.question.entity.Question;
import com.example.online_exam.question.enums.Difficulty;
import com.example.online_exam.question.enums.QuestionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByCourseId(Long courseId);

    @Query("""
        SELECT q FROM Question q
        WHERE q.course.id = :courseId
          AND (:type IS NULL OR q.type = :type)
          AND (:difficulty IS NULL OR q.difficulty = :difficulty)
          AND (:keyword IS NULL OR LOWER(q.content) LIKE LOWER(CONCAT('%', :keyword, '%')))
    """)
    List<Question> search(
            @Param("courseId") Long courseId,
            @Param("type") QuestionType type,
            @Param("difficulty") Difficulty difficulty,
            @Param("keyword") String keyword
    );

    long countByCourseId(Long courseId);
}
