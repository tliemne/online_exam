package com.example.online_exam.question.service;

import com.example.online_exam.question.dto.QuestionResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Cache câu hỏi search trong Redis.
 *
 * Key schema:
 *   questions:list::{courseId}::{type}::{difficulty}::{keyword}::{tagId}
 *   questions:paged::{courseId}::{type}::{difficulty}::{keyword}::{tagId}::{page}::{size}
 *
 * Invalidate: dùng KEYS pattern "questions:*::{courseId}::*" → xóa sạch 100%
 * TTL: 5 phút
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionCacheService {

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    private static final Duration TTL = Duration.ofMinutes(5);
    private static final String PREFIX_LIST  = "questions:list::";
    private static final String PREFIX_PAGED = "questions:paged::";

    // ── Key builders ──────────────────────────────────────

    public String listKey(Long courseId, Object type, Object difficulty, String keyword, Long tagId) {
        return PREFIX_LIST + courseId + "::" + type + "::" + difficulty + "::" + keyword + "::" + tagId;
    }

    public String pagedKey(Long courseId, Object type, Object difficulty, String keyword, Long tagId, int page, int size) {
        return PREFIX_PAGED + courseId + "::" + type + "::" + difficulty + "::" + keyword + "::" + tagId + "::" + page + "::" + size;
    }

    // ── Get ───────────────────────────────────────────────

    public Optional<List<QuestionResponse>> getList(String key) {
        try {
            String json = redis.opsForValue().get(key);
            if (json == null) return Optional.empty();
            return Optional.of(objectMapper.readValue(json, new TypeReference<List<QuestionResponse>>() {}));
        } catch (Exception e) {
            log.warn("[QuestionCache] getList error key={}: {}", key, e.getMessage());
            return Optional.empty();
        }
    }

    // ── Set ───────────────────────────────────────────────

    public void putList(String key, Long courseId, List<QuestionResponse> data) {
        try {
            String json = objectMapper.writeValueAsString(data);
            redis.opsForValue().set(key, json, TTL);
        } catch (Exception e) {
            log.warn("[QuestionCache] putList error key={}: {}", key, e.getMessage());
        }
    }

    public void putPaged(String key, Long courseId, List<QuestionResponse> pageContent) {
        try {
            String json = objectMapper.writeValueAsString(pageContent);
            redis.opsForValue().set(key, json, TTL);
        } catch (Exception e) {
            log.warn("[QuestionCache] putPaged error key={}: {}", key, e.getMessage());
        }
    }

    // ── Invalidate theo courseId ──────────────────────────

    /**
     * Xóa toàn bộ cache câu hỏi của 1 course bằng KEYS pattern.
     * Gọi sau khi create/update/delete câu hỏi.
     */
    public void evictByCourse(Long courseId) {
        try {
            String pattern = "questions:*::" + courseId + "::*";
            Set<String> keys = redis.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                for (String key : keys) {
                    redis.delete(key);
                }
                log.debug("[QuestionCache] evicted {} keys for courseId={}", keys.size(), courseId);
            }
        } catch (Exception e) {
            log.warn("[QuestionCache] evictByCourse error courseId={}: {}", courseId, e.getMessage());
        }
    }
}