package com.example.online_exam.userprofile.dto;

import lombok.Data;

@Data
public class TeacherProfileResponse {
    // Từ users
    private String phone;
    // Từ teacher_profiles
    private String teacherCode;
    private String department;
    private String specialization;
}