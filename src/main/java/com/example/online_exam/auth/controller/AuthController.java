package com.example.online_exam.auth.controller;

import com.example.online_exam.auth.dto.AuthResponse;
import com.example.online_exam.auth.dto.LoginRequest;
import com.example.online_exam.auth.service.AuthService;
import com.example.online_exam.common.dto.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public BaseResponse<AuthResponse> login(@RequestBody LoginRequest request) {
        return BaseResponse.<AuthResponse>builder()
                .status(200)
                .message("Login success")
                .data(authService.login(request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping("/logout")
    public void logout(@RequestParam String refreshToken) {
        authService.logout(refreshToken);
    }

    @PostMapping("/refresh")
    public BaseResponse<AuthResponse> refresh(@RequestParam String refreshToken) {
        return BaseResponse.<AuthResponse>builder()
                .status(200)
                .message("refresh success")
                .data(authService.refresh(refreshToken))
                .timestamp(LocalDateTime.now())
                .build();
    }
}