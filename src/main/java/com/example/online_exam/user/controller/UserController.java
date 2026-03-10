package com.example.online_exam.user.controller;

import com.example.online_exam.auth.dto.AuthResponse;
import com.example.online_exam.common.dto.BaseResponse;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.user.dto.ChangePasswordRequest;
import com.example.online_exam.user.dto.CreateStudentRequest;
import com.example.online_exam.user.dto.CreateStudentResult;
import com.example.online_exam.user.dto.MyProfileResponse;
import com.example.online_exam.user.dto.UserRegisterRequest;
import com.example.online_exam.user.dto.UserResponse;
import com.example.online_exam.user.dto.UserUpdateRequest;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.enums.RoleName;
import com.example.online_exam.user.service.UserService;
import com.example.online_exam.common.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
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

    @Autowired(required = false)
    private EmailService emailService;

    // Public: chỉ tạo được STUDENT hoặc TEACHER
    @PostMapping("/register")
    public BaseResponse<UserResponse> register(@Validated @RequestBody UserRegisterRequest request) {
        // Không cho tạo ADMIN qua endpoint public
        if (request.getRole() == RoleName.ADMIN) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        return BaseResponse.<UserResponse>builder()
                .status(200)
                .message("register success")
                .data(userService.register(request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Chỉ ADMIN mới tạo được mọi role kể cả ADMIN khác
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public BaseResponse<UserResponse> createUser(@Validated @RequestBody UserRegisterRequest request) {
        return BaseResponse.<UserResponse>builder()
                .status(200)
                .message("create user success")
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
    // Xem profile đầy đủ của chính mình (có cả studentProfile / teacherProfile)
    @GetMapping("/me/profile")
    public BaseResponse<MyProfileResponse> myProfile() {
        return BaseResponse.<MyProfileResponse>builder()
                .status(200)
                .message("get my profile success")
                .data(userService.getMyProfile())
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

    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
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

    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
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
    // Teacher tạo tài khoản student (+ gắn vào lớp ngay nếu có courseId)
    @PostMapping("/students")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<CreateStudentResult> createStudent(@Validated @RequestBody CreateStudentRequest request) {
        return BaseResponse.<CreateStudentResult>builder()
                .status(200).message("Tạo tài khoản sinh viên thành công")
                .data(userService.createStudent(request))
                .timestamp(LocalDateTime.now()).build();
    }

    // Teacher xem danh sách tất cả student để thêm vào lớp
    @GetMapping("/students")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<List<UserResponse>> getAllStudents() {
        return BaseResponse.<List<UserResponse>>builder()
                .status(200)
                .message("get all students success")
                .data(userService.getAllByRole(RoleName.STUDENT))
                .timestamp(LocalDateTime.now())
                .build();
    }

    // ── Password ──────────────────────────────────────────

    // User tự đổi mật khẩu của mình (cần nhập mật khẩu cũ)
    @PutMapping("/me/password")
    public BaseResponse<Void> changeMyPassword(@Validated @RequestBody ChangePasswordRequest request) {
        userService.changeMyPassword(request.getOldPassword(), request.getNewPassword());
        return BaseResponse.<Void>builder()
                .status(200).message("Đổi mật khẩu thành công")
                .timestamp(LocalDateTime.now()).build();
    }

    // Admin reset mật khẩu cho bất kỳ user nào
    // Teacher reset mật khẩu cho student (chỉ STUDENT, không reset được ADMIN/TEACHER khác)
    @PutMapping("/{id}/reset-password")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<Void> resetPassword(@PathVariable Long id,
                                            @Validated @RequestBody ChangePasswordRequest request) {
        userService.resetPassword(id, request.getNewPassword());
        return BaseResponse.<Void>builder()
                .status(200).message("Reset mật khẩu thành công")
                .timestamp(LocalDateTime.now()).build();
    }

    // ── Debug: test gửi email ─────────────────────────────
    @GetMapping("/test-email")
    public org.springframework.http.ResponseEntity<String> testEmail(
            @org.springframework.web.bind.annotation.RequestParam String to) {
        if (emailService == null) {
            return org.springframework.http.ResponseEntity.ok("EmailService is NULL — mail config chưa load");
        }
        try {
            emailService.sendStudentCredentials(to, "Test User", "testuser", "test123", "Lớp Test");
            return org.springframework.http.ResponseEntity.ok("Email đã gửi tới: " + to);
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.ok("Lỗi gửi email: " + e.getMessage());
        }
    }

}