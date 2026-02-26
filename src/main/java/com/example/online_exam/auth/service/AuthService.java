package com.example.online_exam.auth.service;

import com.example.online_exam.auth.dto.AuthResponse;
import com.example.online_exam.auth.dto.LoginRequest;
import com.example.online_exam.auth.dto.LoginResponse;

public interface AuthService {
    AuthResponse login(LoginRequest request);

    void logout(String refreshToken);

    AuthResponse refresh(String refreshToken);
}
