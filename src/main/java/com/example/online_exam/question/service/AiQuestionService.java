package com.example.online_exam.question.service;

import com.example.online_exam.question.dto.AnswerRequest;
import com.example.online_exam.question.dto.QuestionRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.*;

/**
 * AI tạo câu hỏi theo chủ đề — 1 request Gemini cho nhiều câu.
 * Cache kết quả preview trong Redis TTL 30 phút.
 * Teacher review → chọn câu muốn lưu → gọi QuestionService.create().
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiQuestionService {

    private final RestTemplate        restTemplate;
    private final ObjectMapper        objectMapper;
    private final StringRedisTemplate redis;
    private final com.example.online_exam.tag.repository.TagRepository tagRepository;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-2.5-flash-preview-04-17}")
    private String geminiModel;

    private String getGeminiUrl() {
        return "https://generativelanguage.googleapis.com/v1beta/models/"
                + geminiModel + ":generateContent";
    }
    private static final Duration CACHE_TTL = Duration.ofMinutes(30);
    private static final String   CACHE_PREFIX = "ai:gen:";

    // ── Request DTO ───────────────────────────────────────
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class GenerateRequest {
        private String  topic;
        private String  type;
        private String  difficulty;
        private int     count;
        private Long    courseId;
        private String  tags;
        private Boolean bustCache; // true = skip Redis cache (student luyện tập)
    }

    // ── Response DTO ─────────────────────────────────────
    public record GeneratedQuestion(
            String              content,
            String              type,
            String              difficulty,
            List<GeneratedAnswer> answers,
            String              explanation  // AI giải thích tại sao đáp án đúng
    ) {}

    public record GeneratedAnswer(String content, boolean correct) {}

    // ── Main method ───────────────────────────────────────
    public List<GeneratedQuestion> generate(GenerateRequest req) {
        log.info("[AiQuestion] generate() called type={} diff={} bustCache={}", req.getType(), req.getDifficulty(), req.getBustCache());
        int count = Math.min(Math.max(req.getCount(), 1), 20); // clamp 1-20

        // Giữ nguyên ALL — buildPrompt xử lý mix type trong 1 lần gọi Gemini
        String resolvedType = req.getType()  != null ? req.getType()       : "MULTIPLE_CHOICE";
        String resolvedDiff = req.getDifficulty() != null ? req.getDifficulty() : "MEDIUM";

        // Cache key
        String cacheKey = CACHE_PREFIX + req.getTopic().toLowerCase().replaceAll("\\s+", "_")
                + ":" + resolvedType + ":" + resolvedDiff + ":" + count
                + (req.getTags() != null && !req.getTags().isBlank() ? ":" + req.getTags().toLowerCase().replaceAll("\\s+","") : "");

        boolean useCache = !Boolean.TRUE.equals(req.getBustCache());

        // Practice cache key - dùng cache riêng 1 giờ cho luyện tập
        String practiceCacheKey = Boolean.TRUE.equals(req.getBustCache())
                ? "ai:practice:" + cacheKey.substring(CACHE_PREFIX.length())
                : null;

        // Check cache - teacher preview dùng 30 phút, student luyện tập dùng 1 giờ
        String checkKey = useCache ? cacheKey : practiceCacheKey;
        if (checkKey != null) {
            try {
                String cached = redis.opsForValue().get(checkKey);
                if (cached != null) {
                    List<GeneratedQuestion> result = objectMapper.readValue(cached,
                            objectMapper.getTypeFactory().constructCollectionType(List.class, GeneratedQuestion.class));
                    log.info("[AiQuestion] cache hit: {}", checkKey);
                    return result;
                }
            } catch (Exception ignored) {}
        }
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            log.warn("[AiQuestion] Gemini API key chưa cấu hình");
            return List.of();
        }

        try {
            String prompt = buildPrompt(req.getTopic(), resolvedType, resolvedDiff, count);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            Map<String, Object> body = Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
            );
            String url = getGeminiUrl() + "?key=" + geminiApiKey;
            ResponseEntity<String> resp = restTemplate.postForEntity(
                    url, new HttpEntity<>(body, headers), String.class);

            List<GeneratedQuestion> result = parseResponse(resp.getBody(), resolvedType, resolvedDiff);

            // Cache kết quả
            try {
                if (useCache) {
                    redis.opsForValue().set(cacheKey, objectMapper.writeValueAsString(result), CACHE_TTL);
                } else if (practiceCacheKey != null) {
                    // Cache luyện tập 1 giờ - lần sau cùng topic/diff dùng lại
                    redis.opsForValue().set(practiceCacheKey, objectMapper.writeValueAsString(result), Duration.ofHours(1));
                }
            } catch (Exception ignored) {}

            return result;

        } catch (org.springframework.web.client.HttpClientErrorException e) {
            String body = e.getResponseBodyAsString();
            if (e.getStatusCode().value() == 429) {
                log.warn("[AiQuestion] quota exceeded (429)");
                throw new com.example.online_exam.exception.AppException(
                        com.example.online_exam.exception.ErrorCode.AI_QUOTA_EXCEEDED);
            }
            log.error("[AiQuestion] generate failed [{}]: {}", e.getClass().getName(), e.getMessage(), e);
            return List.of();
        } catch (Exception e) {
            log.error("[AiQuestion] generate failed [{}]: {}", e.getClass().getName(), e.getMessage(), e);
            return List.of();
        }
    }

    /** Convert GeneratedQuestion → QuestionRequest để save */
    public QuestionRequest toQuestionRequest(GeneratedQuestion gq, Long courseId, String tagsCsv) {
        QuestionRequest req = new QuestionRequest();
        req.setContent(gq.content());
        req.setType(com.example.online_exam.question.enums.QuestionType.valueOf(gq.type()));
        req.setDifficulty(com.example.online_exam.question.enums.Difficulty.valueOf(gq.difficulty()));
        req.setCourseId(courseId);
        List<AnswerRequest> answers = gq.answers().stream().map(a -> {
            AnswerRequest ar = new AnswerRequest();
            ar.setContent(a.content());
            ar.setCorrect(a.correct());
            return ar;
        }).toList();
        req.setAnswers(answers);

        // Resolve tag names → tag IDs
        if (tagsCsv != null && !tagsCsv.isBlank()) {
            List<String> names = java.util.Arrays.stream(tagsCsv.split(","))
                    .map(String::trim).filter(s -> !s.isBlank()).toList();
            List<Long> tagIds = tagRepository.findAll().stream()
                    .filter(t -> names.stream().anyMatch(n -> n.equalsIgnoreCase(t.getName())))
                    .map(t -> t.getId()).toList();
            if (!tagIds.isEmpty()) req.setTagIds(tagIds);
        }
        return req;
    }

    // ── Prompt builder ────────────────────────────────────
    private String buildPrompt(String topic, String type, String difficulty, int count) {
        boolean mixType = "ALL".equals(type);
        boolean mixDiff = "ALL".equals(difficulty);

        String diffDesc = mixDiff ? "mixed" : switch (difficulty) {
            case "EASY" -> "easy"; case "HARD" -> "hard"; default -> "medium";
        };

        if (mixType) {
            return "Tạo " + count + " câu hỏi tiếng Việt về \"" + topic + "\", độ khó " + diffDesc + ".\n"
                + "Mix: MULTIPLE_CHOICE(4 đáp án), TRUE_FALSE(Đúng/Sai), ESSAY(không đáp án).\n"
                + "JSON array only, no markdown:\n"
                + "[{\"type\":\"MULTIPLE_CHOICE\",\"content\":\"?\",\"answers\":[{\"content\":\"a\",\"correct\":true},{\"content\":\"b\",\"correct\":false}],\"explanation\":\"...\"}]\n"
                + "Tạo đúng " + count + " câu, không lặp.";
        }

        boolean isEssay = "ESSAY".equals(type);
        String answersNote = isEssay ? "answers:[]" :
            type.equals("TRUE_FALSE") ? "answers:[{\"content\":\"Đúng\",\"correct\":true},{\"content\":\"Sai\",\"correct\":false}]" :
            "answers:[{\"content\":\"đúng\",\"correct\":true},{\"content\":\"sai1\",\"correct\":false},{\"content\":\"sai2\",\"correct\":false},{\"content\":\"sai3\",\"correct\":false}]";

        return "Tạo " + count + " câu hỏi tiếng Việt loại " + type + " về \"" + topic + "\", độ khó " + diffDesc + ".\n"
            + "JSON array only, no markdown:\n"
            + "[{\"type\":\"" + type + "\",\"content\":\"?\",\"" + answersNote + ",\"explanation\":\"...\"}]\n"
            + "Tạo đúng " + count + " câu, không lặp.";
    }

    // ── Response parser ───────────────────────────────────
    private List<GeneratedQuestion> parseResponse(String body, String type, String difficulty) {
        try {
            JsonNode root = objectMapper.readTree(body);
            String text = root.path("candidates").get(0)
                    .path("content").path("parts").get(0).path("text").asText();
            text = text.replaceAll("(?s)```json|```", "").trim();
            log.debug("[AiQuestion] raw ({}): {}", type, text.length() > 300 ? text.substring(0, 300) : text);

            // AI đôi khi wrap trong object {"questions":[...]} thay vì array
            JsonNode parsed = objectMapper.readTree(text);
            JsonNode arr = parsed.isArray() ? parsed : parsed.path("questions");

            List<GeneratedQuestion> result = new ArrayList<>();
            for (JsonNode node : arr) {
                String content = node.path("content").asText("").trim();
                if (content.isBlank()) continue;

                // Dùng type từ AI response nếu có (khi gọi với type=ALL)
                // Fallback về type param nếu AI không trả về
                String resolvedType = node.path("type").isMissingNode() || node.path("type").asText("").isBlank()
                        ? type : node.path("type").asText(type);

                // Normalize type value
                resolvedType = switch (resolvedType.toUpperCase()) {
                    case "MULTIPLE_CHOICE", "MC" -> "MULTIPLE_CHOICE";
                    case "TRUE_FALSE", "TF"      -> "TRUE_FALSE";
                    case "ESSAY"                 -> "ESSAY";
                    default                      -> "MULTIPLE_CHOICE";
                };

                List<GeneratedAnswer> answers = new ArrayList<>();
                for (JsonNode a : node.path("answers")) {
                    String ac = a.path("content").asText("").trim();
                    if (!ac.isBlank())
                        answers.add(new GeneratedAnswer(ac, a.path("correct").asBoolean()));
                }
                result.add(new GeneratedQuestion(
                        content, resolvedType, difficulty, answers,
                        node.path("explanation").asText("")));
            }
            log.info("[AiQuestion] parsed {}/{} types={}", result.size(), arr.size(),
                    result.stream().map(GeneratedQuestion::type).distinct().toList());
            return result;
        } catch (Exception e) {
            log.error("[AiQuestion] parse failed: {}", e.getMessage());
            return List.of();
        }
    }

    // ── Helpers: resolve ALL → random cụ thể ─────────────
    private static final java.util.Random RANDOM = new java.util.Random();

    private String resolveType(String type) {
        if (type == null || type.isBlank() || type.equals("ALL")) {
            String[] types = {"MULTIPLE_CHOICE", "TRUE_FALSE", "ESSAY"};
            return types[RANDOM.nextInt(types.length)];
        }
        return type;
    }

    private String resolveDifficulty(String difficulty) {
        if (difficulty == null || difficulty.isBlank() || difficulty.equals("ALL")) {
            String[] diffs = {"EASY", "MEDIUM", "HARD"};
            return diffs[RANDOM.nextInt(diffs.length)];
        }
        return difficulty;
    }

}