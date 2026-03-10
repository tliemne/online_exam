package com.example.online_exam.userprofile.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class StudentProfileUpdateRequest {
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private String className;
}