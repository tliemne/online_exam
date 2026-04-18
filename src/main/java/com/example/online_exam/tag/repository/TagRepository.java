package com.example.online_exam.tag.repository;

import com.example.online_exam.tag.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {

    Optional<Tag> findByName(String name);

    boolean existsByName(String name);

    List<Tag> findAllByOrderByNameAsc();

    // Thống kê: số câu hỏi theo từng tag
    @Query("""
        SELECT t.id, t.name, t.color, COUNT(q.id)
        FROM Tag t LEFT JOIN t.questions q
        GROUP BY t.id, t.name, t.color
        ORDER BY t.name ASC
    """)
    List<Object[]> countQuestionsByTag();

    // Thống kê: số câu hỏi theo danh sách tag IDs (cho pagination)
    @Query("""
        SELECT t.id, COUNT(q.id)
        FROM Tag t LEFT JOIN t.questions q
        WHERE t.id IN :tagIds
        GROUP BY t.id
    """)
    List<Object[]> countQuestionsByTagIds(@Param("tagIds") List<Long> tagIds);

    // Tags của 1 question
    @Query("SELECT t FROM Tag t JOIN t.questions q WHERE q.id = :questionId ORDER BY t.name")
    List<Tag> findByQuestionId(@Param("questionId") Long questionId);
}