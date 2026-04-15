package com.example.online_exam.discussion.repository;

import com.example.online_exam.discussion.entity.DiscussionReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface DiscussionReplyRepository extends JpaRepository<DiscussionReply, Long> {

    List<DiscussionReply> findByPostIdAndIsDeletedFalse(Long postId);

    List<DiscussionReply> findByParentReplyId(Long parentReplyId);

    @Query("SELECT r FROM DiscussionReply r WHERE r.post.id = :postId AND r.isDeleted = false ORDER BY r.voteCount DESC")
    List<DiscussionReply> findByPostIdOrderByVoteCountDesc(@Param("postId") Long postId);

    @Query("SELECT COUNT(r) FROM DiscussionReply r WHERE r.post.id = :postId AND r.isDeleted = false")
    Long countByPostId(@Param("postId") Long postId);

    @Query("SELECT COUNT(r) FROM DiscussionReply r WHERE r.post.course.id = :courseId AND r.isDeleted = false")
    Long countByCourseId(@Param("courseId") Long courseId);

    @Query("SELECT r FROM DiscussionReply r JOIN FETCH r.author WHERE r.post.course.id = :courseId AND r.isDeleted = false")
    List<DiscussionReply> findByCourseIdWithAuthor(@Param("courseId") Long courseId);

    // Admin stats methods
    Long countByAuthorIdAndIsDeletedFalse(Long authorId);
    
    @Query("SELECT COUNT(r) FROM DiscussionReply r WHERE r.post.course.id = :courseId AND r.isDeleted = false")
    Long countByPostCourseId(@Param("courseId") Long courseId);
    
    Long countByCreatedAtAfter(LocalDateTime date);
}
