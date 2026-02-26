package com.example.online_exam.user.service;

import com.example.online_exam.user.dto.UserRegisterRequest;
import com.example.online_exam.user.dto.UserResponse;

import java.util.List;

public interface UserService {
    UserResponse register(UserRegisterRequest request);

    UserResponse getById(Long id);

    List<UserResponse> getAll();

    void delete(Long id);
}
