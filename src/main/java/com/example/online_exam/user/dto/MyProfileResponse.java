package com.example.online_exam.user.dto;

import com.example.online_exam.userprofile.dto.StudentProfileResponse;
import com.example.online_exam.userprofile.dto.TeacherProfileResponse;
import lombok.Data;

@Data
public class MyProfileResponse {
    private UserResponse account;
    private StudentProfileResponse studentProfile;
    private TeacherProfileResponse teacherProfile;
}