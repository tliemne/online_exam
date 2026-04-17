package com.example.online_exam.auth.service;

import com.example.online_exam.activitylog.entity.ActivityLogAction;
import com.example.online_exam.activitylog.service.ActivityLogService;
import com.example.online_exam.auth.dto.AuthResponse;
import com.example.online_exam.auth.dto.LoginRequest;
import com.example.online_exam.auth.repository.RedisRefreshTokenRepository;
import com.example.online_exam.common.service.EmailService;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.secutity.service.JwtService;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository              userRepository;
    private final PasswordEncoder             passwordEncoder;
    private final JwtService                  jwtService;
    private final RedisRefreshTokenRepository redisTokenRepo;
    private final ActivityLogService          activityLogService;
    private final LoginRateLimiter            rateLimiter;
    private final StringRedisTemplate         redisTemplate;

    @Autowired(required = false)
    private EmailService emailService;

    private static final String RESET_PREFIX = "pwd_reset:";
    private static final long   RESET_TTL_MINUTES = 15;

    @Override
    public AuthResponse login(LoginRequest request) {
        rateLimiter.checkBlocked(request.getUsername());

        User user = userRepository.findByUsername(request.getUsername())
                .orElseGet(() -> {
                    rateLimiter.recordFailure(request.getUsername());
                    throw new AppException(ErrorCode.USER_NOT_FOUND);
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            rateLimiter.recordFailure(request.getUsername());
            throw new AppException(ErrorCode.INVALID_PASSWORD);
        }

        rateLimiter.recordSuccess(request.getUsername());

        String accessToken  = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

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
        redisTokenRepo.extend(refreshToken, userId);

        return AuthResponse.builder()
                .accessToken(newAccess)
                .refreshToken(refreshToken)
                .build();
    }

    @Override
    public void forgotPassword(String email) {
        // Always return success to prevent email enumeration
        if (email == null || email.isBlank()) return;

        userRepository.findByEmail(email).ifPresent(user -> {
            if (emailService == null) {
                log.warn("EmailService not configured, cannot send reset email");
                return;
            }

            // Rate limit: max 3 requests per hour per email
            String rateLimitKey = "forgot_pwd_limit:" + email;
            String countStr = redisTemplate.opsForValue().get(rateLimitKey);
            int count = countStr != null ? Integer.parseInt(countStr) : 0;
            if (count >= 3) {
                log.warn("Forgot password rate limit exceeded for email: {}", email);
                return; // Silently ignore - don't reveal to attacker
            }
            // Increment counter, set TTL 1 hour on first request
            if (count == 0) {
                redisTemplate.opsForValue().set(rateLimitKey, "1", 1, TimeUnit.HOURS);
            } else {
                redisTemplate.opsForValue().increment(rateLimitKey);
            }

            // Generate reset token and store in Redis
            String token = UUID.randomUUID().toString();
            redisTemplate.opsForValue().set(
                RESET_PREFIX + token,
                user.getId().toString(),
                RESET_TTL_MINUTES, TimeUnit.MINUTES
            );
            emailService.sendForgotPasswordLink(email, user.getFullName(), token);
            log.info("Password reset email sent to {} (attempt {})", email, count + 1);
        });
    }

    @Override
    public void resetPasswordByToken(String token, String newPassword) {
        String key = RESET_PREFIX + token;
        String userIdStr = redisTemplate.opsForValue().get(key);

        if (userIdStr == null) {
            throw new AppException(ErrorCode.TOKEN_INVALID);
        }

        Long userId = Long.parseLong(userIdStr);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Delete token after use
        redisTemplate.delete(key);
        log.info("Password reset successfully for user {}", user.getUsername());
    }
}