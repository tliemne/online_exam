package com.example.online_exam.discussion.entity;

import com.example.online_exam.common.entity.BaseEntity;
import com.example.online_exam.course.entity.Course;
import com.example.online_exam.discussion.enums.PostStatus;
import com.example.online_exam.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "discussion_posts", indexes = {
        @Index(name = "idx_post_course", columnList = "course_id"),
        @Index(name = "idx_post_author", columnList = "author_id"),
        @Index(name = "idx_post_status", columnList = "status"),
        @Index(name = "idx_post_created", columnList = "created_at"),
        @Index(name = "idx_post_votes", columnList = "vote_count"),
        @Index(name = "idx_post_course_status", columnList = "course_id, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DiscussionPost extends BaseEntity {

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostStatus status = PostStatus.ACTIVE;

    @Column(columnDefinition = "INTEGER DEFAULT 0")
    private Integer voteCount = 0;
    
    @Column(columnDefinition = "INTEGER DEFAULT 0")
    private Integer dislikeCount = 0;
    
    @Column(columnDefinition = "INTEGER DEFAULT 0")
    private Integer replyCount = 0;
    
    @Column(columnDefinition = "BIT DEFAULT 0")
    private Boolean hasBestAnswer = false;

    @ManyToMany
    @JoinTable(
            name = "discussion_post_tags",
            joinColumns = @JoinColumn(name = "post_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<DiscussionTag> tags = new HashSet<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DiscussionReply> replies = new ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DiscussionAttachment> attachments = new ArrayList<>();
}
