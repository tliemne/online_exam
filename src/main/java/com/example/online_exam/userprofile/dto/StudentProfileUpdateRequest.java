package com.example.online_exam.userprofile.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class StudentProfileUpdateRequest {
    // email, fullName, phone, dateOfBirth → cập nhật thẳng vào bảng users
    private String email;
    private String fullName;
    private String phone;           // → lưu vào users.phone
    private LocalDate dateOfBirth;  // → lưu vào users.date_of_birth
    // Thông tin đặc thù student
    private String className;
}