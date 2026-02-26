package com.example.online_exam.user.controller;

import com.example.online_exam.auth.dto.AuthResponse;
import com.example.online_exam.common.dto.BaseResponse;
import com.example.online_exam.user.dto.UserRegisterRequest;
import com.example.online_exam.user.dto.UserResponse;
import com.example.online_exam.user.dto.UserUpdateRequest;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.service.UserService;
import com.example.online_exam.userprofile.dto.StudentProfileResponse;
import com.example.online_exam.userprofile.dto.StudentProfileUpdateRequest;
import com.example.online_exam.userprofile.dto.TeacherProfileResponse;
import com.example.online_exam.userprofile.dto.TeacherProfileUpdateRequest;
import com.example.online_exam.userprofile.entity.StudentProfile;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.AuthenticatedPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public BaseResponse<UserResponse> register(@Validated @RequestBody UserRegisterRequest request) {
        return BaseResponse.<UserResponse>builder()
                .status(200)
                .message("register success")
                .data(userService.register(request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/me")
    public BaseResponse<UserResponse> me(@AuthenticationPrincipal User currentUser) {
        return BaseResponse.<UserResponse>builder()
                .status(200)
                .message("get my profile success")
                .data(userService.getById(currentUser.getId()))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PutMapping("/me/student-profile")
    public BaseResponse<StudentProfileResponse> updateMyStudentProfile(@RequestBody StudentProfileUpdateRequest request) {
        return BaseResponse.<StudentProfileResponse>builder()
                .status(200)
                .message("update student profile success")
                .data(userService.updateMyStudentProfile(request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PutMapping("/me/teacher-profile")
    public BaseResponse<TeacherProfileResponse> updateMyTeacherProfile(@RequestBody TeacherProfileUpdateRequest request) {
        return BaseResponse.<TeacherProfileResponse>builder()
                .status(200)
                .message("update teacher profile success")
                .data(userService.updateMyTeacherProfile(request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PreAuthorize("hasRole('ADMIN') of #id == authentication.principal.id")
    @GetMapping("/{id}")
    public BaseResponse<UserResponse> getById(@PathVariable Long id) {
        return BaseResponse.<UserResponse>builder()
                .status(200)
                .message("get user by id success")
                .data(userService.getById(id))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public BaseResponse<List<UserResponse>> getAll() {
        return BaseResponse.<List<UserResponse>>builder()
                .status(200)
                .message("get all user success")
                .data(userService.getAll())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PreAuthorize("hasRole('ADMIN') of #id == authentication.principal.id")
    @PutMapping("/{id}")
    public BaseResponse<UserResponse> update(@PathVariable Long id, @Validated @RequestBody UserUpdateRequest request) {
        return BaseResponse.<UserResponse>builder()
                .status(200)
                .message("update user success")
                .data(userService.update(id, request))
                .timestamp(LocalDateTime.now())
                .build();

    }
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public BaseResponse<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return BaseResponse.<Void>builder()
                .status(200)
                .message("delete user success")
                .timestamp(LocalDateTime.now())
                .build();
    }
}