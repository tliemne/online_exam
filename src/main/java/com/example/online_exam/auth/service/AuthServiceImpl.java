package com.example.online_exam.auth.service;

import com.example.online_exam.activitylog.entity.ActivityLogAction;
import com.example.online_exam.activitylog.service.ActivityLogService;
import com.example.online_exam.auth.dto.AuthResponse;
import com.example.online_exam.auth.dto.LoginRequest;
import com.example.online_exam.auth.repository.RedisRefreshTokenRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.secutity.service.JwtService;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository            userRepository;
    private final PasswordEncoder           passwordEncoder;
    private final JwtService                jwtService;
    private final RedisRefreshTokenRepository redisTokenRepo;
    private final ActivityLogService        activityLogService;

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.INVALID_PASSWORD);
        }

        String accessToken  = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        // Lưu vào Redis với TTL tự động — không cần cleanup job
        redisTokenRepo.save(refreshToken, user.getId());

        activityLogService.logUser(user, ActivityLogAction.LOGIN,
                "USER", user.getId(), "Đăng nhập hệ thống");

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    @Override
    public void logout(String refreshToken) {
        // Tìm userId để log trước khi xóa
        redisTokenRepo.findUserIdByToken(refreshToken).ifPresent(userId -> {
            redisTokenRepo.deleteByToken(refreshToken);
            userRepository.findById(userId).ifPresent(user ->
                    activityLogService.logUser(user, ActivityLogAction.LOGOUT,
                            "USER", userId, "Đăng xuất hệ thống")
            );
        });
    }

    @Override
    public AuthResponse refresh(String refreshToken) {
        Long userId = redisTokenRepo.findUserIdByToken(refreshToken)
                .orElseThrow(() -> new AppException(ErrorCode.TOKEN_INVALID));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        String newAccess = jwtService.generateAccessToken(user);

        // Gia hạn TTL mỗi lần refresh (sliding window)
        redisTokenRepo.extend(refreshToken, userId);

        return AuthResponse.builder()
                .accessToken(newAccess)
                .refreshToken(refreshToken)
                .build();
    }
}