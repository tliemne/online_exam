package com.example.online_exam.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Rate limit đăng nhập sai bằng Redis.
 *
 * Key schema:
 *   login:fail:{username}  → số lần sai (TTL tự reset sau cửa sổ thời gian)
 *   login:block:{username} → "1" khi bị khóa (TTL = thời gian phạt)
 *
 * Logic:
 *   - Sai <= MAX_ATTEMPTS lần trong WINDOW → tăng counter
 *   - Sai > MAX_ATTEMPTS → khóa BLOCK_DURATION, reset counter
 *   - Đăng nhập đúng → xóa counter
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LoginRateLimiter {

    private final StringRedisTemplate redis;

    private static final int      MAX_ATTEMPTS   = 5;               // tối đa 5 lần sai
    private static final Duration WINDOW         = Duration.ofMinutes(15); // trong 15 phút
    private static final Duration BLOCK_DURATION = Duration.ofMinutes(30); // khóa 30 phút

    private static final String FAIL_PREFIX  = "login:fail:";
    private static final String BLOCK_PREFIX = "login:block:";

    /** Gọi TRƯỚC khi check password — kiểm tra có đang bị block không */
    public void checkBlocked(String username) {
        if (Boolean.TRUE.equals(redis.hasKey(BLOCK_PREFIX + username))) {
            Long ttl = redis.getExpire(BLOCK_PREFIX + username);
            long minutes = ttl != null ? (ttl / 60) + 1 : BLOCK_DURATION.toMinutes();
            throw new com.example.online_exam.exception.AppException(
                    com.example.online_exam.exception.ErrorCode.TOO_MANY_LOGIN_ATTEMPTS,
                    "Tài khoản tạm khóa do đăng nhập sai quá nhiều lần. Thử lại sau " + minutes + " phút."
            );
        }
    }

    /** Gọi khi đăng nhập SAI — tăng counter, block nếu vượt ngưỡng */
    public void recordFailure(String username) {
        try {
            String failKey = FAIL_PREFIX + username;
            Long count = redis.opsForValue().increment(failKey);
            if (count == null) return;

            if (count == 1) {
                // Set TTL khi lần đầu fail
                redis.expire(failKey, WINDOW);
            }

            if (count >= MAX_ATTEMPTS) {
                // Block
                redis.opsForValue().set(BLOCK_PREFIX + username, "1", BLOCK_DURATION);
                redis.delete(failKey);
                log.warn("[RateLimit] User '{}' blocked after {} failed attempts", username, count);
            } else {
                log.debug("[RateLimit] User '{}' failed login {}/{}", username, count, MAX_ATTEMPTS);
            }
        } catch (Exception e) {
            log.warn("[RateLimit] recordFailure error: {}", e.getMessage());
        }
    }

    /** Gọi khi đăng nhập THÀNH CÔNG — xóa counter */
    public void recordSuccess(String username) {
        try {
            redis.delete(FAIL_PREFIX  + username);
            redis.delete(BLOCK_PREFIX + username);
        } catch (Exception e) {
            log.warn("[RateLimit] recordSuccess error: {}", e.getMessage());
        }
    }

    /** Số lần sai hiện tại (để frontend hiển thị nếu cần) */
    public int getFailCount(String username) {
        try {
            String val = redis.opsForValue().get(FAIL_PREFIX + username);
            return val != null ? Integer.parseInt(val) : 0;
        } catch (Exception e) {
            return 0;
        }
    }
}