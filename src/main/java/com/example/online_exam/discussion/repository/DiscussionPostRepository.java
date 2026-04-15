package com.example.online_exam.discussion.repository;

import com.example.online_exam.discussion.entity.DiscussionPost;
import com.example.online_exam.discussion.enums.PostStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface DiscussionPostRepository extends JpaRepository<DiscussionPost, Long> {

    Page<DiscussionPost> findByCourseIdAndStatus(Long courseId, PostStatus status, Pageable pageable);

    Optional<DiscussionPost> findByIdAndStatus(Long id, PostStatus status);

    @Query("SELECT COUNT(p) FROM DiscussionPost p WHERE p.course.id = :courseId AND p.status = :status")
    Long countByCourseIdAndStatus(@Param("courseId") Long courseId, @Param("status") PostStatus status);

    @Query("SELECT COUNT(p) FROM DiscussionPost p WHERE p.course.id = :courseId AND p.hasBestAnswer = :hasBestAnswer AND p.status = 'ACTIVE'")
    Long countByCourseIdAndHasBestAnswer(@Param("courseId") Long courseId, @Param("hasBestAnswer") Boolean hasBestAnswer);

    @Query("SELECT p FROM DiscussionPost p JOIN FETCH p.author WHERE p.course.id = :courseId")
    java.util.List<DiscussionPost> findByCourseIdWithAuthor(@Param("courseId") Long courseId);

    // Admin stats methods
    Long countByAuthorId(Long authorId);
    
    Long countByCourseId(Long courseId);
    
    Long countByCreatedAtAfter(LocalDateTime date);
}
