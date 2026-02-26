package com.example.online_exam.user.dto;

import com.example.online_exam.user.entity.Role;
import com.example.online_exam.user.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data

public class UserResponse {

    private Long id;
    private String username;
    private String email;
    private String fullName;
    private UserStatus status;
    private Set<String> roles;
}