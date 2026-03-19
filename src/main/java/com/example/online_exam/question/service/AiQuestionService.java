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

        boolean useCache = !Boolean.TRUE.equals(req.getBustCache()); // false khi student luyện tập

        // Check cache
        if (useCache) {
            try {
                String cached = redis.opsForValue().get(cacheKey);
                if (cached != null) {
                    List<GeneratedQuestion> result = objectMapper.readValue(cached,
                            objectMapper.getTypeFactory().constructCollectionType(List.class, GeneratedQuestion.class));
                    log.info("[AiQuestion] cache hit: {}", cacheKey);
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

            // Cache kết quả (chỉ khi không set bustCache)
            if (useCache) {
                try {
                    redis.opsForValue().set(cacheKey, objectMapper.writeValueAsString(result), CACHE_TTL);
                } catch (Exception ignored) {}
            }

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

        String diffDesc = mixDiff ? "hỗn hợp (dễ, trung bình, khó)" : switch (difficulty) {
            case "EASY"  -> "dễ, kiến thức cơ bản";
            case "HARD"  -> "khó, cần suy luận sâu";
            default      -> "trung bình";
        };

        if (mixType) {
            // 1 lần gọi AI, yêu cầu mix 3 loại — AI tự gán type vào từng câu
            return "Tạo " + count + " câu hỏi về chủ đề \"" + topic + "\", mức độ " + diffDesc + ".\n"
                    + "Ngôn ngữ: tiếng Việt.\n"
                    + "Phân bổ loại câu: khoảng 1/3 trắc nghiệm (MULTIPLE_CHOICE), 1/3 đúng/sai (TRUE_FALSE), 1/3 tự luận (ESSAY).\n"
                    + "Return ONLY valid JSON array. No markdown, no explanation outside JSON.\n\n"
                    + "JSON format (MỖI câu PHẢI có field \"type\"):\n"
                    + "[\n"
                    + "  { \"type\": \"MULTIPLE_CHOICE\", \"content\": \"...\", \"answers\": [{\"content\":\"...\",\"correct\":true},{\"content\":\"...\",\"correct\":false},{\"content\":\"...\",\"correct\":false},{\"content\":\"...\",\"correct\":false}], \"explanation\": \"...\" },\n"
                    + "  { \"type\": \"TRUE_FALSE\",      \"content\": \"...\", \"answers\": [{\"content\":\"Đúng\",\"correct\":true},{\"content\":\"Sai\",\"correct\":false}], \"explanation\": \"...\" },\n"
                    + "  { \"type\": \"ESSAY\",           \"content\": \"...\", \"answers\": [], \"explanation\": \"...\" }\n"
                    + "]\n\n"
                    + "Yêu cầu:\n"
                    + "- Phải tạo ĐÚNG " + count + " câu hỏi\n"
                    + "- Field \"type\" bắt buộc: MULTIPLE_CHOICE | TRUE_FALSE | ESSAY\n"
                    + "- Câu MULTIPLE_CHOICE cần đúng 4 answers (1 đúng, 3 sai gây nhiễu tốt)\n"
                    + "- Câu TRUE_FALSE cần đúng 2 answers (Đúng/Sai)\n"
                    + "- Câu ESSAY để answers = []\n"
                    + "- Không lặp lại câu hỏi";
        }

        // Single type
        boolean isEssay = "ESSAY".equals(type);
        String typeDesc = switch (type) {
            case "MULTIPLE_CHOICE" -> "trắc nghiệm 4 đáp án (1 đúng, 3 sai)";
            case "TRUE_FALSE"      -> "đúng/sai (2 đáp án: Đúng và Sai, 1 cái đúng)";
            case "ESSAY"           -> "tự luận (không có đáp án cố định)";
            default                -> "trắc nghiệm 4 đáp án (1 đúng, 3 sai)";
        };
        String answersFormat = isEssay
                ? "[]"
                : "[{\"content\": \"<đáp án>\", \"correct\": true}, {\"content\": \"<đáp án>\", \"correct\": false}]";
        String requirement = isEssay
                ? "- Câu hỏi yêu cầu trình bày/phân tích, không có đáp án đúng/sai cố định"
                : "- Đáp án sai phải hợp lý (gây nhiễu tốt)";

        return "Tạo " + count + " câu hỏi " + typeDesc + " về chủ đề \"" + topic + "\", mức độ " + diffDesc + ".\n"
                + "Ngôn ngữ: tiếng Việt.\n"
                + "Return ONLY valid JSON array. No markdown, no explanation outside JSON.\n\n"
                + "JSON format:\n"
                + "[\n"
                + "  { \"type\": \"" + type + "\", \"content\": \"<nội dung>\", \"answers\": " + answersFormat + ", \"explanation\": \"<gợi ý>\" }\n"
                + "]\n\n"
                + "Yêu cầu:\n"
                + "- Phải tạo ĐÚNG " + count + " câu hỏi\n"
                + "- Câu hỏi rõ ràng, không mơ hồ\n"
                + requirement + "\n"
                + "- Không lặp lại câu hỏi";
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