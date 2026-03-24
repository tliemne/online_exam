package com.example.online_exam.userprofile.dto;

import lombok.Data;

@Data
public class TeacherProfileUpdateRequest {
    // email, fullName, phone → cập nhật thẳng vào bảng users
    private String email;
    private String fullName;
    private String phone;       // → lưu vào users.phone
    // Thông tin đặc thù teacher
    private String department;
    private String specialization;
}