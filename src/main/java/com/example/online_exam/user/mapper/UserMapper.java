package com.example.online_exam.user.mapper;


import com.example.online_exam.user.dto.UserRegisterRequest;
import com.example.online_exam.user.dto.UserResponse;
import com.example.online_exam.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface UserMapper {

//    User toEntity(UserRegisterRequest request);
//    UserResponse toResponse(User user);
default UserResponse toRoleAwareResponse(User user, boolean includeSensitive, boolean includeId) {
    UserResponse response = new UserResponse();

    if (includeId) {
        response.setId(user.getId());
    }

    response.setUsername(user.getUsername());
    response.setFullName(user.getFullName());
    response.setRoles(user.getRoles().stream()
            .map(role -> role.getName().name())
            .collect(Collectors.toSet()));

    if (includeSensitive) {
        response.setEmail(user.getEmail());
        response.setStatus(user.getStatus());
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

