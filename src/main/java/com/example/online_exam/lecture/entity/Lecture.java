package com.example.online_exam.lecture.entity;

import com.example.online_exam.common.entity.BaseEntity;
import com.example.online_exam.course.entity.Course;
import com.example.online_exam.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "lectures")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Lecture extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    // YouTube hoặc Google Drive link
    @Column(name = "video_url", length = 500)
    private String videoUrl;

    // Thứ tự hiển thị trong lớp
    @Column(name = "order_index")
    private Integer orderIndex = 1;
}