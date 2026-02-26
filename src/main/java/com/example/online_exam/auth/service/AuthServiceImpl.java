package com.example.online_exam.auth.service;

import com.example.online_exam.auth.dto.AuthResponse;
import com.example.online_exam.auth.dto.LoginRequest;
import com.example.online_exam.auth.dto.LoginResponse;
import com.example.online_exam.auth.entity.RefreshToken;
import com.example.online_exam.auth.repository.RefreshTokenRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.secutity.service.JwtService;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.repository.UserRepository;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor

public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenRepository refreshTokenRepository;

    @Override
    public AuthResponse login(LoginRequest request) {

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.INVALID_PASSWORD);
        }

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        refreshTokenRepository.save(
                RefreshToken.builder()
                        .token(refreshToken)
                        .user(user)
                        .expiryDate(LocalDateTime.now().plusDays(7))
                        .build()
        );

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }
    @Override
    public void logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken)
                .ifPresent(refreshTokenRepository::delete);
    }
    @Override
    public AuthResponse refresh(String refreshToken) {

        RefreshToken token = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new AppException(ErrorCode.TOKEN_INVALID));

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(token);
            throw new AppException(ErrorCode.TOKEN_EXPIRED);
        }

        User user = token.getUser();

        String newAccess = jwtService.generateAccessToken(user);

        return AuthResponse.builder()
                .accessToken(newAccess)
                .refreshToken(refreshToken)
                .build();
    }
}

