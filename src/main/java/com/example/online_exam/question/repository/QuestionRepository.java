package com.example.online_exam.question.repository;

import com.example.online_exam.question.entity.Question;
import com.example.online_exam.question.enums.Difficulty;
import com.example.online_exam.question.enums.QuestionType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByCourseId(Long courseId);

    // Phân trang — dùng cho QuestionsPage (20 câu/trang)
    @Query("""
        SELECT q FROM Question q
        WHERE (:courseId IS NULL OR q.course.id = :courseId)
          AND (:type IS NULL OR q.type = :type)
          AND (:difficulty IS NULL OR q.difficulty = :difficulty)
          AND (:keyword IS NULL OR LOWER(q.content) LIKE LOWER(CONCAT('%', :keyword, '%')))
    """)
    Page<Question> searchPaged(
            @Param("courseId")   Long courseId,
            @Param("type")       QuestionType type,
            @Param("difficulty") Difficulty difficulty,
            @Param("keyword")    String keyword,
            Pageable pageable
    );

    // List version — dùng cho AddQuestionsModal (không cần phân trang)
    // LEFT JOIN FETCH tags để tránh LazyInit khi toResponse() đọc q.getTags()
    @Query("""
        SELECT DISTINCT q FROM Question q LEFT JOIN FETCH q.tags
        WHERE q.course.id = :courseId
          AND (:type IS NULL OR q.type = :type)
          AND (:difficulty IS NULL OR q.difficulty = :difficulty)
          AND (:keyword IS NULL OR LOWER(q.content) LIKE LOWER(CONCAT('%', :keyword, '%')))
    """)
    List<Question> search(
            @Param("courseId")   Long courseId,
            @Param("type")       QuestionType type,
            @Param("difficulty") Difficulty difficulty,
            @Param("keyword")    String keyword
    );

    // List version có filter tag — dùng cho AddQuestionsModal khi chọn tag
    @Query("""
        SELECT DISTINCT q FROM Question q LEFT JOIN FETCH q.tags t2
        WHERE q.course.id = :courseId
          AND (:type IS NULL OR q.type = :type)
          AND (:difficulty IS NULL OR q.difficulty = :difficulty)
          AND (:keyword IS NULL OR LOWER(q.content) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:tagId IS NULL OR EXISTS (
              SELECT 1 FROM Question q2 JOIN q2.tags t3
              WHERE q2.id = q.id AND t3.id = :tagId
          ))
    """)
    List<Question> searchWithTag(
            @Param("courseId")   Long courseId,
            @Param("type")       QuestionType type,
            @Param("difficulty") Difficulty difficulty,
            @Param("keyword")    String keyword,
            @Param("tagId")      Long tagId
    );

    long countByCourseId(Long courseId);

    // Lọc theo tag
    @Query("""
        SELECT DISTINCT q FROM Question q LEFT JOIN q.tags t
        WHERE (:courseId IS NULL OR q.course.id = :courseId)
          AND (:type IS NULL OR q.type = :type)
          AND (:difficulty IS NULL OR q.difficulty = :difficulty)
          AND (:keyword IS NULL OR LOWER(q.content) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:tagId IS NULL OR t.id = :tagId)
    """)
    Page<Question> searchPagedWithTag(
            @Param("courseId")   Long courseId,
            @Param("type")       QuestionType type,
            @Param("difficulty") Difficulty difficulty,
            @Param("keyword")    String keyword,
            @Param("tagId")      Long tagId,
            Pageable pageable
    );

    // Xóa toàn bộ câu hỏi do 1 teacher tạo (dùng khi xóa tài khoản teacher)
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM Question q WHERE q.createdBy.id = :userId")
    void deleteByCreatedById(@Param("userId") Long userId);
    java.util.List<com.example.online_exam.question.entity.Question> findByCreatedById(Long userId);

    /** Random câu hỏi theo tag + course, tuỳ chọn lọc difficulty */
    @Query("""
        SELECT q FROM Question q JOIN q.tags t
        WHERE q.course.id = :courseId
          AND t.id = :tagId
          AND (:difficulty IS NULL OR q.difficulty = :difficulty)
        ORDER BY FUNCTION('RAND')
    """)
    List<Question> findRandomByTag(
            @Param("courseId")   Long courseId,
            @Param("tagId")      Long tagId,
            @Param("difficulty") Difficulty difficulty,
            Pageable pageable
    );
}