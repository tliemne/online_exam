package com.example.online_exam.user.service;

import com.example.online_exam.user.dto.MyProfileResponse;
import com.example.online_exam.user.dto.UserRegisterRequest;
import com.example.online_exam.user.dto.UserResponse;
import com.example.online_exam.user.dto.UserUpdateRequest;
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

    StudentProfileResponse updateMyStudentProfile(StudentProfileUpdateRequest request);

    TeacherProfileResponse updateMyTeacherProfile(TeacherProfileUpdateRequest request);
}
