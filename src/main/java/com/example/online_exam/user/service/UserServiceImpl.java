package com.example.online_exam.user.service;

import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.user.dto.UserRegisterRequest;
import com.example.online_exam.user.dto.UserResponse;
import com.example.online_exam.user.entity.Role;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.enums.RoleName;
import com.example.online_exam.user.enums.UserStatus;
import com.example.online_exam.user.mapper.UserMapper;
import com.example.online_exam.user.repository.RoleRepository;
import com.example.online_exam.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserResponse register(UserRegisterRequest request) {

        // check username
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USERNAME_EXISTS);
        }

        // check email
        if (request.getEmail() != null &&
                userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTS);
        }

        // map request -> entity
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());

        // encode password
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        // default status
        user.setStatus(UserStatus.ACTIVE);

        // set role mặc định STUDENT
        RoleName roleName = request.getRole() != null ? request.getRole() : RoleName.STUDENT;
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new AppException(ErrorCode.INTERNAL_ERROR));

        user.setRoles(Set.of(role));

        userRepository.save(user);

        return userMapper.toResponse(user);
    }

    @Override
    public UserResponse getById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return userMapper.toResponse(user);
    }

    @Override
    public List<UserResponse> getAll() {
        return userRepository.findAll()
                .stream()
                .map(userMapper::toResponse)
                .toList();
    }

    @Override
    public void delete(Long id) {

        if (!userRepository.existsById(id)) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        userRepository.deleteById(id);
    }
}