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

        // phone, dateOfBirth từ users trực tiếp
        response.setPhone(user.getPhone());
        response.setDateOfBirth(user.getDateOfBirth());

        // Auto-gen adminCode nếu là ADMIN
        boolean isAdmin = user.getRoles().stream()
                .anyMatch(r -> r.getName().name().equals("ADMIN"));
        if (isAdmin && user.getId() != null) {
            response.setAdminCode(String.format("AD%d%04d",
                    java.time.Year.now().getValue(), user.getId()));
        }

        if (includeSensitive) {
            response.setEmail(user.getEmail());
            response.setStatus(user.getStatus());
        }

        // ── Map student profile — chỉ còn studentCode + className ──
        if (user.getStudentProfile() != null) {
            UserResponse.StudentProfileData sp = new UserResponse.StudentProfileData();
            sp.setStudentCode(user.getStudentProfile().getStudentCode());
            sp.setClassName(user.getStudentProfile().getClassName());
            response.setStudentProfile(sp);
        }

        // ── Map teacher profile — chỉ còn teacherCode + dept + spec ──
        if (user.getTeacherProfile() != null) {
            UserResponse.TeacherProfileData tp = new UserResponse.TeacherProfileData();
            tp.setTeacherCode(user.getTeacherProfile().getTeacherCode());
            tp.setDepartment(user.getTeacherProfile().getDepartment());
            tp.setSpecialization(user.getTeacherProfile().getSpecialization());
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