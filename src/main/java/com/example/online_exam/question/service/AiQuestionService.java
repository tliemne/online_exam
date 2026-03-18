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
    public record GenerateRequest(
            String topic,
            String type,
            String difficulty,
            int    count,
            Long   courseId,
            String tags,
            Long   _nocache  // optional, bust Redis cache key khi student luyện tập
    ) {}

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
        int count = Math.min(Math.max(req.count(), 1), 20); // clamp 1-20

        // Cache key theo topic + type + difficulty + count + tags
        String cacheKey = CACHE_PREFIX + req.topic().toLowerCase().replaceAll("\\s+", "_")
                + ":" + req.type() + ":" + req.difficulty() + ":" + count
                + (req.tags() != null && !req.tags().isBlank() ? ":" + req.tags().toLowerCase().replaceAll("\\s+","") : "");

        boolean useCache = req._nocache() == null; // skip cache khi student luyện tập

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
            String prompt = buildPrompt(req.topic(), req.type(), req.difficulty(), count);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            Map<String, Object> body = Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
            );
            String url = getGeminiUrl() + "?key=" + geminiApiKey;
            ResponseEntity<String> resp = restTemplate.postForEntity(
                    url, new HttpEntity<>(body, headers), String.class);

            List<GeneratedQuestion> result = parseResponse(resp.getBody(), req.type(), req.difficulty());

            // Cache kết quả (chỉ khi không có _nocache flag)
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
            log.error("[AiQuestion] generate failed: {}", e.getMessage());
            return List.of();
        } catch (Exception e) {
            log.error("[AiQuestion] generate failed: {}", e.getMessage());
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
        String typeDesc = switch (type) {
            case "MULTIPLE_CHOICE" -> "trắc nghiệm 4 đáp án (1 đúng, 3 sai)";
            case "TRUE_FALSE"      -> "đúng/sai (2 đáp án: Đúng và Sai, 1 cái đúng)";
            case "ESSAY"           -> "tự luận (không có đáp án cố định, cần đánh giá mở)";
            default                -> "trắc nghiệm 4 đáp án (1 đúng, 3 sai)";
        };
        String diffDesc = switch (difficulty) {
            case "EASY"   -> "dễ, kiến thức cơ bản";
            case "HARD"   -> "khó, cần suy luận sâu";
            default       -> "trung bình";
        };

        boolean isEssay = type.equals("ESSAY");

        return String.format("""
            Tạo %d câu hỏi %s về chủ đề "%s", mức độ %s.
            Ngôn ngữ: tiếng Việt.
            Return ONLY valid JSON array. No markdown, no explanation outside JSON.
            
            JSON format:
            [
              {
                "content": "<nội dung câu hỏi>",
                "answers": %s,
                "explanation": "<gợi ý đáp án / tiêu chí chấm, ≤50 từ>"
              }
            ]
            
            Yêu cầu:
            - Phải tạo ĐÚNG %d câu hỏi, không ít hơn
            - Câu hỏi rõ ràng, không mơ hồ
            %s
            - Không lặp lại câu hỏi
            """, count, typeDesc, topic, diffDesc, count,
                isEssay ? "[]" : """
                    [
                      {"content": "<đáp án>", "correct": true},
                      {"content": "<đáp án>", "correct": false}
                    ]""",
                isEssay ? "- Câu hỏi yêu cầu trình bày/phân tích, không có đáp án đúng/sai cố định"
                        : "- Đáp án sai phải hợp lý (gây nhiễu tốt)");
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
                List<GeneratedAnswer> answers = new ArrayList<>();
                for (JsonNode a : node.path("answers")) {
                    String ac = a.path("content").asText("").trim();
                    if (!ac.isBlank())
                        answers.add(new GeneratedAnswer(ac, a.path("correct").asBoolean()));
                }
                result.add(new GeneratedQuestion(
                        content, type, difficulty, answers,
                        node.path("explanation").asText("")));
            }
            log.info("[AiQuestion] parsed {}/{} (type={})", result.size(), arr.size(), type);
            return result;
        } catch (Exception e) {
            log.error("[AiQuestion] parse failed: {}", e.getMessage());
            return List.of();
        }
    }
}