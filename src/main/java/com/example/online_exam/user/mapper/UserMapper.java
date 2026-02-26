package com.example.online_exam.user.mapper;


import com.example.online_exam.user.dto.UserRegisterRequest;
import com.example.online_exam.user.dto.UserResponse;
import com.example.online_exam.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    User toEntity(UserRegisterRequest request);
//
//    @Mapping(target = "status", expression = "java(user.getStatus().name())")
//    @Mapping(target = "roles", expression = "java(user.getRoles().stream().map(r -> r.getName().name()).collect(java.util.stream.Collectors.toSet()))")
    UserResponse toResponse(User user);
}

