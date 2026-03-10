package com.example.online_exam.userprofile.dto;
import lombok.Data;

@Data
public class TeacherProfileUpdateRequest {
    private String email;
    private String phone;
    private String department;
    private String specialization;
}