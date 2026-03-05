package com.example.online_exam.user.dto;

import com.example.online_exam.user.enums.RoleName;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserRegisterRequest {
    @NotBlank
    private String username;
    @NotBlank
    private String password;
    @NotBlank
    @Email
    private String email;  // bắt buộc, không được null
    private String fullName;
    private RoleName role;
    // ── Thêm mới: Admin điền khi tạo tài khoản ──
    private String studentCode;   // Dùng khi role = STUDENT
    private String teacherCode;   // Dùng khi role = TEACHER
    private String phone;
    private String className;     // Cho STUDENT
    private String department;    // Cho TEACHER
    private String specialization; // Cho TEACHER
}