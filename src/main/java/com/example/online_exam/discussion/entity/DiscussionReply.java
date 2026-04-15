package com.example.online_exam.discussion.entity;

import com.example.online_exam.common.entity.BaseEntity;
import com.example.online_exam.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "discussion_replies", indexes = {
        @Index(name = "idx_reply_post", columnList = "post_id"),
        @Index(name = "idx_reply_author", columnList = "author_id"),
        @Index(name = "idx_reply_created", columnList = "created_at"),
        @Index(name = "idx_reply_votes", columnList = "vote_count"),
        @Index(name = "idx_reply_best", columnList = "is_best_answer"),
        @Index(name = "idx_reply_post_deleted", columnList = "post_id, is_deleted")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DiscussionReply extends BaseEntity {

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private DiscussionPost post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_reply_id")
    private DiscussionReply parentReply;

    @Column(columnDefinition = "INTEGER DEFAULT 0")
    private Integer voteCount = 0;
    
    @Column(columnDefinition = "INTEGER DEFAULT 0")
    private Integer dislikeCount = 0;
    
    @Column(columnDefinition = "BIT DEFAULT 0")
    private Boolean isBestAnswer = false;
    
    @Column(columnDefinition = "BIT DEFAULT 0")
    private Boolean isDeleted = false;

    @OneToMany(mappedBy = "reply", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<DiscussionAttachment> attachments = new java.util.ArrayList<>();
}
