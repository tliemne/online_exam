package com.example.online_exam.userprofile.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class StudentProfileResponse {
    // Từ users
    private String phone;
    private LocalDate dateOfBirth;
    // Từ student_profiles
    private String studentCode;
    private String className;
}