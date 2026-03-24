package com.example.online_exam.user.dto;

import com.example.online_exam.user.enums.UserStatus;
import lombok.Data;
import java.time.LocalDate;
import java.util.Set;

@Data
public class UserResponse {

    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String avatarUrl;
    private String phone;           // từ users.phone
    private LocalDate dateOfBirth;  // từ users.date_of_birth
    private String adminCode;
    private UserStatus status;
    private Set<String> roles;
    private StudentProfileData studentProfile;
    private TeacherProfileData teacherProfile;

    @Data
    public static class StudentProfileData {
        private String studentCode;
        private String className;
        // phone và dateOfBirth đã lên UserResponse gốc
    }

    @Data
    public static class TeacherProfileData {
        private String teacherCode;
        private String department;
        private String specialization;
        // phone đã lên UserResponse gốc
    }
}