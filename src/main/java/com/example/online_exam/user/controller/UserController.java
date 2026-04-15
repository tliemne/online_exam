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
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

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

    // User tự cập nhật fullName + email
    @PutMapping("/me")
    public BaseResponse<UserResponse> updateMe(@Validated @RequestBody UserUpdateRequest request) {
        return BaseResponse.<UserResponse>builder()
                .status(200).message("Cập nhật thành công")
                .data(userService.updateMe(request))
                .timestamp(LocalDateTime.now()).build();
    }

    // Upload avatar
    @PostMapping("/me/avatar")
    public BaseResponse<String> uploadAvatar(@RequestParam("file") MultipartFile file) {
        // Validate
        String ct = file.getContentType();
        if (ct == null || !ct.startsWith("image/"))
            return BaseResponse.<String>builder().status(400).message("Chỉ chấp nhận file ảnh").timestamp(LocalDateTime.now()).build();
        if (file.getSize() > 2 * 1024 * 1024)
            return BaseResponse.<String>builder().status(400).message("Ảnh tối đa 2MB").timestamp(LocalDateTime.now()).build();

        try {
            String ext      = file.getOriginalFilename() != null
                    ? file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf('.'))
                    : ".jpg";
            String fileName = UUID.randomUUID() + ext;
            Path   uploadDir = Paths.get("uploads/avatars");
            Files.createDirectories(uploadDir);
            Files.copy(file.getInputStream(), uploadDir.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);

            String avatarUrl = "/uploads/avatars/" + fileName;
            userService.updateAvatar(avatarUrl);

            return BaseResponse.<String>builder()
                    .status(200).message("Upload thành công")
                    .data(avatarUrl).timestamp(LocalDateTime.now()).build();
        } catch (IOException e) {
            return BaseResponse.<String>builder().status(500).message("Lỗi upload file").timestamp(LocalDateTime.now()).build();
        }
    }

    // Delete avatar (set to null)
    @DeleteMapping("/me/avatar")
    public BaseResponse<String> deleteAvatar() {
        userService.updateAvatar(null);
        return BaseResponse.<String>builder()
                .status(200)
                .message("Đã gỡ ảnh đại diện")
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
    // Chỉ ADMIN tạo tài khoản student
    @PostMapping("/students")
    @PreAuthorize("hasRole('ADMIN')")
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

    @GetMapping("/teachers")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<List<UserResponse>> getAllTeachers() {
        return BaseResponse.<List<UserResponse>>builder()
                .status(200)
                .message("get all teachers success")
                .data(userService.getAllByRole(RoleName.TEACHER))
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

    // Chỉ ADMIN reset mật khẩu
    @PutMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
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