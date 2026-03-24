package com.example.online_exam.course.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class StudentWithProfileResponse {
    // Từ users
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String phone;           // users.phone
    private LocalDate dateOfBirth;  // users.date_of_birth
    // Từ student_profiles
    private String studentCode;
    private String className;
}