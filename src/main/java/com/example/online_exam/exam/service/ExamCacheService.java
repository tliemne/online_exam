package com.example.online_exam.exam.service;

import com.example.online_exam.exam.dto.ExamResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

/**
 * Cache đề thi (kèm câu hỏi) trong Redis.
 *
 * Key: exam:questions:{examId}
 * TTL: 1 giờ
 *
 * Evict khi: exam bị sửa/xóa câu hỏi, exam bị đóng
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExamCacheService {

    private final StringRedisTemplate redis;
    private final ObjectMapper        objectMapper;

    private static final Duration TTL    = Duration.ofHours(1);
    private static final String   PREFIX = "exam:questions:";

    // ── Get ───────────────────────────────────────────────
    public Optional<ExamResponse> get(Long examId) {
        try {
            String key  = PREFIX + examId;
            String json = redis.opsForValue().get(key);
            if (json == null) return Optional.empty();
            return Optional.of(objectMapper.readValue(json, ExamResponse.class));
        } catch (Exception e) {
            log.warn("[ExamCache] get error examId={}: {}", examId, e.getMessage());
            return Optional.empty();
        }
    }

    // ── Put ───────────────────────────────────────────────
    public void put(Long examId, ExamResponse response) {
        try {
            String key  = PREFIX + examId;
            String json = objectMapper.writeValueAsString(response);
            redis.opsForValue().set(key, json, TTL);
        } catch (Exception e) {
            log.warn("[ExamCache] put error examId={}: {}", examId, e.getMessage());
        }
    }

    // ── Evict ─────────────────────────────────────────────
    public void evict(Long examId) {
        try {
            redis.delete(PREFIX + examId);
        } catch (Exception e) {
            log.warn("[ExamCache] evict error examId={}: {}", examId, e.getMessage());
        }
    }
}