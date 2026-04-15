package com.example.online_exam.discussion.entity;

import com.example.online_exam.common.entity.BaseEntity;
import com.example.online_exam.discussion.enums.VoteType;
import com.example.online_exam.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "discussion_votes",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"user_id", "post_id"}),
                @UniqueConstraint(columnNames = {"user_id", "reply_id"})
        },
        indexes = {
                @Index(name = "idx_vote_user", columnList = "user_id"),
                @Index(name = "idx_vote_post", columnList = "post_id"),
                @Index(name = "idx_vote_reply", columnList = "reply_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DiscussionVote extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private DiscussionPost post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_id")
    private DiscussionReply reply;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VoteType voteType;
}
