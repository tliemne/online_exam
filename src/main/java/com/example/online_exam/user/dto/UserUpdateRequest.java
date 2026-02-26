package com.example.online_exam.user.dto;

import com.example.online_exam.user.enums.UserStatus;
import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class UserUpdateRequest {
    @Email
    private String email;
    private String fullName;
    private UserStatus status;
}