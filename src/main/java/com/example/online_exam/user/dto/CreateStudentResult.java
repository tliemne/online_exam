package com.example.online_exam.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Trả về sau khi tạo student thành công.
 * Bao gồm plain password để Teacher thông báo cho student.
 * ⚠ Chỉ trả về 1 lần — sau đó không thể lấy lại được.
 */
@Data
@AllArgsConstructor
public class CreateStudentResult {
    private Long   id;
    private String username;
    private String fullName;
    private String email;
    private String plainPassword;   // mật khẩu gốc để teacher thông báo
    private String studentCode;
    private String className;
    private Long   enrolledCourseId; // null nếu không gắn lớp
}