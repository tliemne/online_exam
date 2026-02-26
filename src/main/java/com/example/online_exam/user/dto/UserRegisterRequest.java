package com.example.online_exam.user.dto;

import com.example.online_exam.user.enums.RoleName;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserRegisterRequest {
    @NotBlank
    private String username;
    @NotBlank
    private String password;
    @NotBlank
    private String email;

    private String fullName;

    private RoleName role;
}