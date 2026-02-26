package com.example.online_exam.user.controller;

import com.example.online_exam.auth.dto.AuthResponse;
import com.example.online_exam.common.dto.BaseResponse;
import com.example.online_exam.user.dto.UserRegisterRequest;
import com.example.online_exam.user.dto.UserResponse;
import com.example.online_exam.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public BaseResponse<UserResponse> register(@RequestBody UserRegisterRequest request) {
        return BaseResponse.<UserResponse>builder()
                .status(200)
                .message("register success")
                .data(userService.register(request))
                .timestamp(LocalDateTime.now())
                .build();
    }
    @GetMapping
    public BaseResponse<List<UserResponse>> getAll() {
        return BaseResponse.<List<UserResponse>>builder()
                .status(200)
                .message("get user by id success")
                .data(userService.getAll())
                .timestamp(LocalDateTime.now())
                .build();
    }
}