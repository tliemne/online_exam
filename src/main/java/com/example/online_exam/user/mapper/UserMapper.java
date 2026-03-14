package com.example.online_exam.user.mapper;

import com.example.online_exam.user.dto.UserResponse;
import com.example.online_exam.user.entity.User;
import org.mapstruct.Mapper;

import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface UserMapper {

    default UserResponse toRoleAwareResponse(User user, boolean includeSensitive, boolean includeId) {
        UserResponse response = new UserResponse();

        if (includeId) {
            response.setId(user.getId());
        }

        response.setUsername(user.getUsername());
        response.setFullName(user.getFullName());
        response.setAvatarUrl(user.getAvatarUrl());
        response.setRoles(user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toSet()));

        if (includeSensitive) {
            response.setEmail(user.getEmail());
            response.setStatus(user.getStatus());
        }

        // ── Map student profile ──
        if (user.getStudentProfile() != null) {
            UserResponse.StudentProfileData sp = new UserResponse.StudentProfileData();
            sp.setStudentCode(user.getStudentProfile().getStudentCode());
            sp.setPhone(user.getStudentProfile().getPhone());
            response.setStudentProfile(sp);
        }

        // ── Map teacher profile ──
        if (user.getTeacherProfile() != null) {
            UserResponse.TeacherProfileData tp = new UserResponse.TeacherProfileData();
            tp.setTeacherCode(user.getTeacherProfile().getTeacherCode());
            tp.setPhone(user.getTeacherProfile().getPhone());
            response.setTeacherProfile(tp);
        }

        return response;
    }

    default UserResponse toPrivateResponse(User user) {
        return toRoleAwareResponse(user, true, true);
    }

    default UserResponse toPublicResponse(User user) {
        return toRoleAwareResponse(user, false, false);
    }
}