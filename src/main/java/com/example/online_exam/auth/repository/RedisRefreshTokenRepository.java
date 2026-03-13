package com.example.online_exam.auth.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.Optional;

/**
 * Lưu refresh token trong Redis thay vì MySQL.
 *
 * Key schema:
 *   refresh_token:{token}  →  userId (String)
 *   user_tokens:{userId}   →  token  (để lookup ngược khi logout-all)
 *
 * TTL tự động — không cần cleanup job.
 */
@Repository
@RequiredArgsConstructor
public class RedisRefreshTokenRepository {

    private final StringRedisTemplate redis;

    @Value("${app.refresh-token.ttl-seconds:604800}")
    private long ttlSeconds;

    private static final String TOKEN_PREFIX = "refresh_token:";
    private static final String USER_PREFIX  = "user_tokens:";

    // ── Lưu token ────────────────────────────────────────
    public void save(String token, Long userId) {
        Duration ttl = Duration.ofSeconds(ttlSeconds);
        // token → userId
        redis.opsForValue().set(TOKEN_PREFIX + token, userId.toString(), ttl);
        // userId → token (ghi đè nếu login lại — 1 user 1 token)
        redis.opsForValue().set(USER_PREFIX + userId, token, ttl);
    }

    // ── Tìm userId theo token ─────────────────────────────
    public Optional<Long> findUserIdByToken(String token) {
        String val = redis.opsForValue().get(TOKEN_PREFIX + token);
        if (val == null) return Optional.empty();
        try {
            return Optional.of(Long.parseLong(val));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    // ── Kiểm tra token còn hợp lệ không ─────────────────
    public boolean exists(String token) {
        return Boolean.TRUE.equals(redis.hasKey(TOKEN_PREFIX + token));
    }

    // ── Xóa token (logout) ───────────────────────────────
    public void deleteByToken(String token) {
        String userIdStr = redis.opsForValue().get(TOKEN_PREFIX + token);
        redis.delete(TOKEN_PREFIX + token);
        if (userIdStr != null) {
            // Xóa ngược user→token nếu vẫn trỏ về token này
            String currentToken = redis.opsForValue().get(USER_PREFIX + userIdStr);
            if (token.equals(currentToken)) {
                redis.delete(USER_PREFIX + userIdStr);
            }
        }
    }

    // ── Xóa tất cả token của 1 user (force logout all) ───
    public void deleteByUserId(Long userId) {
        String token = redis.opsForValue().get(USER_PREFIX + userId);
        if (token != null) {
            redis.delete(TOKEN_PREFIX + token);
        }
        redis.delete(USER_PREFIX + userId);
    }

    // ── Gia hạn TTL khi dùng refresh ─────────────────────
    public void extend(String token, Long userId) {
        Duration ttl = Duration.ofSeconds(ttlSeconds);
        redis.expire(TOKEN_PREFIX + token, ttl);
        redis.expire(USER_PREFIX + userId, ttl);
    }
}