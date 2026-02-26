package com.example.online_exam.course.entity;

import com.example.online_exam.common.entity.BaseEntity;
import com.example.online_exam.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "courses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Course extends BaseEntity {

    @Column(nullable = false)
    private String name;

    private String description;

    // giáo viên phụ trách
    @ManyToOne
    @JoinColumn(name = "teacher_id")
    private User teacher;

    // danh sách học sinh
    @ManyToMany
    @JoinTable(
            name = "course_students",
            joinColumns = @JoinColumn(name = "course_id"),
            inverseJoinColumns = @JoinColumn(name = "student_id")
    )
    private Set<User> students = new HashSet<>();
}
