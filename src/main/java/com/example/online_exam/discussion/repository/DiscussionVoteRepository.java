package com.example.online_exam.discussion.repository;

import com.example.online_exam.discussion.entity.DiscussionVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface DiscussionVoteRepository extends JpaRepository<DiscussionVote, Long> {

    Optional<DiscussionVote> findByUserIdAndPostId(Long userId, Long postId);

    Optional<DiscussionVote> findByUserIdAndReplyId(Long userId, Long replyId);

    void deleteByUserIdAndPostId(Long userId, Long postId);

    void deleteByUserIdAndReplyId(Long userId, Long replyId);

    // Delete all votes for a post (for cascade delete)
    @Transactional
    @Modifying
    @Query("DELETE FROM DiscussionVote v WHERE v.post.id = :postId")
    void deleteByPostId(@Param("postId") Long postId);

    // Delete all votes for a reply (for cascade delete)
    @Transactional
    @Modifying
    @Query("DELETE FROM DiscussionVote v WHERE v.reply.id = :replyId")
    void deleteByReplyId(@Param("replyId") Long replyId);
}
