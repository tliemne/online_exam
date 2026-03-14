package com.example.online_exam.user.service;

import com.example.online_exam.user.dto.ChangePasswordRequest;
import com.example.online_exam.user.dto.CreateStudentRequest;
import com.example.online_exam.user.dto.CreateStudentResult;
import com.example.online_exam.user.dto.MyProfileResponse;
import com.example.online_exam.user.dto.UserRegisterRequest;
import com.example.online_exam.user.dto.UserResponse;
import com.example.online_exam.user.dto.UserUpdateRequest;
import com.example.online_exam.user.enums.RoleName;
import com.example.online_exam.userprofile.dto.StudentProfileResponse;
import com.example.online_exam.userprofile.dto.StudentProfileUpdateRequest;
import com.example.online_exam.userprofile.dto.TeacherProfileResponse;
import com.example.online_exam.userprofile.dto.TeacherProfileUpdateRequest;
import com.example.online_exam.userprofile.entity.StudentProfile;

import java.util.List;

public interface UserService {
    UserResponse register(UserRegisterRequest request);

    UserResponse getById(Long id);

    List<UserResponse> getAll();

    void delete(Long id);
    MyProfileResponse getMyProfile();

    UserResponse update(Long id, UserUpdateRequest request);
    UserResponse updateMe(UserUpdateRequest request);
    void updateAvatar(String avatarUrl);

    StudentProfileResponse updateMyStudentProfile(StudentProfileUpdateRequest request);

    TeacherProfileResponse updateMyTeacherProfile(TeacherProfileUpdateRequest request);
    List<UserResponse> getAllByRole(RoleName role);

    // Teacher tạo student (+ tùy chọn gắn vào lớp ngay)
    CreateStudentResult createStudent(CreateStudentRequest request);

    // User tự đổi mật khẩu (cần xác nhận mật khẩu cũ)
    void changeMyPassword(String oldPassword, String newPassword);

    // Admin/Teacher reset mật khẩu cho user bất kỳ
    void resetPassword(Long userId, String newPassword);
}