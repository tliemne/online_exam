package com.example.online_exam.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Teacher dùng để tạo tài khoản student.
 * Khác UserRegisterRequest: email optional, có thể gắn courseId ngay.
 */
@Data
public class CreateStudentRequest {

    @NotBlank(message = "Username không được để trống")
    private String username;

    @NotBlank(message = "Họ tên không được để trống")
    private String fullName;

    // Mật khẩu — nếu không nhập sẽ tự sinh (username + "123")
    private String password;

    // Email optional — có thể bỏ trống
    private String email;

    // Mã sinh viên, lớp học (lưu vào StudentProfile)
    private String studentCode;
    private String className;

    // Gắn vào lớp học ngay sau khi tạo (optional)
    private Long courseId;
}