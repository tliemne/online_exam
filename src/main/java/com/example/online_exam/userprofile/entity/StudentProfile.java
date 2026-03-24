package com.example.online_exam.userprofile.entity;

import com.example.online_exam.common.entity.BaseEntity;
import com.example.online_exam.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "student_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StudentProfile extends BaseEntity {

    @OneToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "student_code", unique = true, length = 50)
    private String studentCode;

    // phone, dateOfBirth đã chuyển lên bảng users — xem User.java
    // Chỉ giữ lại fields đặc thù của STUDENT

    @Column(name = "class_name", length = 100)
    private String className;
}