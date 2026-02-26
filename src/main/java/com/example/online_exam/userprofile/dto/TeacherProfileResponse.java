package com.example.online_exam.userprofile.dto;

import lombok.Data;

@Data
public class TeacherProfileResponse {
    private String teacherCode;
    private String phone;
    private String department;
    private String specialization;
}
