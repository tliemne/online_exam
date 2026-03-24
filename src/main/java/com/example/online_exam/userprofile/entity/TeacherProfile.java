package com.example.online_exam.userprofile.entity;

import com.example.online_exam.common.entity.BaseEntity;
import com.example.online_exam.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "teacher_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TeacherProfile extends BaseEntity {

    @OneToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "teacher_code", unique = true, length = 50)
    private String teacherCode;

    // phone đã chuyển lên bảng users — xem User.java
    // Chỉ giữ lại fields đặc thù của TEACHER

    @Column(name = "department", length = 100)
    private String department;

    @Column(name = "specialization", length = 255)
    private String specialization;
}