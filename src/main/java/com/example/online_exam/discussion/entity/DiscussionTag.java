package com.example.online_exam.discussion.entity;

import com.example.online_exam.common.entity.BaseEntity;
import com.example.online_exam.course.entity.Course;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "discussion_tags",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"course_id", "name"})
        },
        indexes = {
                @Index(name = "idx_tag_course", columnList = "course_id"),
                @Index(name = "idx_tag_name", columnList = "name")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DiscussionTag extends BaseEntity {

    @Column(nullable = false, length = 30)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    private Integer usageCount = 0;
}
