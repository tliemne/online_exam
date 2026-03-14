package com.example.online_exam.user.dto;

import com.example.online_exam.user.entity.Role;
import com.example.online_exam.user.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data

public class UserResponse {

    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String avatarUrl;
    private String adminCode;
    private UserStatus status;
    private Set<String> roles;
    private StudentProfileData studentProfile;
    private TeacherProfileData teacherProfile;

    @Data
    public static class StudentProfileData {
        private String studentCode;
        private String phone;
    }

    @Data
    public static class TeacherProfileData {
        private String teacherCode;
        private String phone;
    }
}