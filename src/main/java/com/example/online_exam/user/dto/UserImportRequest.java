package com.example.online_exam.user.dto;

import com.example.online_exam.user.enums.RoleName;
import lombok.Data;

/**
 * Admin dùng để import hàng loạt user từ Excel.
 * Khác CreateStudentRequest: có thêm field role (STUDENT/TEACHER).
 */
@Data
public class UserImportRequest {

    private String username;
    private String fullName;
    private String password;
    private String email;

    // Role: STUDENT hoặc TEACHER (mặc định STUDENT nếu để trống)
    private RoleName role;

    // Chỉ dùng khi role = STUDENT
    private String studentCode;
    private String className;

    // Chỉ dùng khi role = TEACHER
    private String teacherCode;
    private String department;
}