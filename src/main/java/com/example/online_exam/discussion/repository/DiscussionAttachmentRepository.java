package com.example.online_exam.discussion.repository;

import com.example.online_exam.discussion.entity.DiscussionAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface DiscussionAttachmentRepository extends JpaRepository<DiscussionAttachment, Long> {

    List<DiscussionAttachment> findByPostIdOrderByCreatedAtAsc(Long postId);

    List<DiscussionAttachment> findByReplyIdOrderByCreatedAtAsc(Long replyId);

    @Modifying
    @Transactional
    @Query("DELETE FROM DiscussionAttachment a WHERE a.post.id = :postId")
    void deleteByPostId(@Param("postId") Long postId);

    @Modifying
    @Transactional
    @Query("DELETE FROM DiscussionAttachment a WHERE a.reply.id = :replyId")
    void deleteByReplyId(@Param("replyId") Long replyId);

    Long countByPostId(Long postId);

    Long countByReplyId(Long replyId);
}
