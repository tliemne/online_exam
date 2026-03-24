package com.example.online_exam.attempt.service;

import com.example.online_exam.attempt.dto.AiSuggestionResponse;
import com.example.online_exam.attempt.dto.AiExplanationResponse;
import com.example.online_exam.attempt.entity.Attempt;
import com.example.online_exam.attempt.entity.AttemptAnswer;
import com.example.online_exam.attempt.repository.AttemptRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiGradingService {

    private final AttemptRepository    attemptRepo;
    private final ObjectMapper         objectMapper;
    private final RestTemplate         restTemplate;
    private final StringRedisTemplate  redis;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:}")
    private String geminiModel;

    private String getGeminiUrl() {
        return "https://generativelanguage.googleapis.com/v1beta/models/"
                + geminiModel + ":generateContent";
    }

    private static final Duration EXPLAIN_TTL = Duration.ofHours(1);
    private static final String   EXPLAIN_PREFIX = "ai:explain:";

    // ── Explain wrong answers for student ────────────────────
    public AiExplanationResponse.Summary explainWrongAnswers(Long attemptId) {
        // Cache check — tránh gọi lại AI cho cùng 1 attempt
        String cacheKey = EXPLAIN_PREFIX + attemptId;
        try {
            String cached = redis.opsForValue().get(cacheKey);
            if (cached != null)
                return objectMapper.readValue(cached, AiExplanationResponse.Summary.class);
        } catch (Exception ignored) {}

        Attempt attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> new AppException(ErrorCode.ATTEMPT_NOT_FOUND));

        // Chỉ lấy câu SAI (MC/TF) — không lấy essay, không lấy câu đúng → tiết kiệm token
        List<AttemptAnswer> wrong = attempt.getAnswers().stream()
                .filter(aa -> Boolean.FALSE.equals(aa.getIsCorrect()))
                .filter(aa -> !aa.getQuestion().getType().name().equals("ESSAY"))
                .limit(10) // tối đa 10 câu để không tốn token
                .collect(Collectors.toList());

        if (wrong.isEmpty()) {
            return AiExplanationResponse.Summary.builder()
                    .explanations(List.of())
                    .overallFeedback("Tuyệt vời! Bạn trả lời đúng tất cả các câu.")
                    .weakTopics(List.of())
                    .build();
        }

        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return fallbackExplanation(wrong);
        }

        try {
            String prompt = buildExplainPrompt(wrong);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            Map<String, Object> body = Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
            );
            String url = getGeminiUrl() + "?key=" + geminiApiKey;
            ResponseEntity<String> resp = restTemplate.postForEntity(
                    url, new HttpEntity<>(body, headers), String.class);

            AiExplanationResponse.Summary result = parseExplainResponse(resp.getBody(), wrong);

            // Cache kết quả 1 giờ
            try {
                redis.opsForValue().set(cacheKey, objectMapper.writeValueAsString(result), EXPLAIN_TTL);
            } catch (Exception ignored) {}

            return result;
        } catch (Exception e) {
            log.error("AI explain failed: {}", e.getMessage());
            return fallbackExplanation(wrong);
        }
    }

    private String buildExplainPrompt(List<AttemptAnswer> wrong) {
        StringBuilder sb = new StringBuilder();
        sb.append("""
            Bạn là gia sư giải thích câu hỏi thi. Với mỗi câu sai dưới đây, hãy:
            1. Giải thích ngắn tại sao đáp án đúng là đúng (≤40 từ)
            2. Gợi ý ghi nhớ (≤15 từ)
            Return ONLY valid JSON. No markdown, no explanation outside JSON.
            
            """);
        for (AttemptAnswer aa : wrong) {
            String correct = aa.getQuestion().getAnswers().stream()
                    .filter(a -> a.isCorrect()).map(a -> a.getContent())
                    .findFirst().orElse("?");
            String chosen = aa.getSelectedAnswer() != null
                    ? aa.getSelectedAnswer().getContent() : "(không chọn)";
            sb.append(String.format(
                    "id=%d | Câu: %s | Bạn chọn: %s | Đúng: %s\n",
                    aa.getId(),
                    aa.getQuestion().getContent(),
                    chosen, correct));
        }
        sb.append("""
            
            JSON format:
            {
              "explanations": [{"id":<answerId>,"explanation":"...","tip":"..."}],
              "overallFeedback": "<nhận xét chung ≤30 từ>",
              "weakTopics": ["<chủ đề 1>","<chủ đề 2>"]
            }
            """);
        return sb.toString();
    }

    private AiExplanationResponse.Summary parseExplainResponse(
            String responseBody, List<AttemptAnswer> wrong) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String text = root.path("candidates").get(0)
                    .path("content").path("parts").get(0).path("text").asText();
            text = text.replaceAll("(?s)```json|```", "").trim();

            JsonNode json   = objectMapper.readTree(text);
            JsonNode expArr = json.path("explanations");

            Map<Long, AttemptAnswer> answerMap = wrong.stream()
                    .collect(Collectors.toMap(AttemptAnswer::getId, a -> a));

            List<AiExplanationResponse> explanations = new ArrayList<>();
            for (JsonNode node : expArr) {
                long id = node.path("id").asLong();
                AttemptAnswer aa = answerMap.get(id);
                if (aa == null) continue;

                String correct = aa.getQuestion().getAnswers().stream()
                        .filter(a -> a.isCorrect()).map(a -> a.getContent())
                        .findFirst().orElse("?");
                String chosen = aa.getSelectedAnswer() != null
                        ? aa.getSelectedAnswer().getContent() : "(không chọn)";

                explanations.add(AiExplanationResponse.builder()
                        .attemptAnswerId(id)
                        .questionId(aa.getQuestion().getId())
                        .questionContent(aa.getQuestion().getContent())
                        .yourAnswer(chosen)
                        .correctAnswer(correct)
                        .explanation(node.path("explanation").asText(""))
                        .tip(node.path("tip").asText(""))
                        .build());
            }

            List<String> weakTopics = new ArrayList<>();
            json.path("weakTopics").forEach(t -> weakTopics.add(t.asText()));

            return AiExplanationResponse.Summary.builder()
                    .explanations(explanations)
                    .overallFeedback(json.path("overallFeedback").asText(""))
                    .weakTopics(weakTopics)
                    .build();
        } catch (Exception e) {
            log.error("Parse explain response failed: {}", e.getMessage());
            return fallbackExplanation(wrong);
        }
    }

    private AiExplanationResponse.Summary fallbackExplanation(List<AttemptAnswer> wrong) {
        List<AiExplanationResponse> list = wrong.stream().map(aa -> {
            String correct = aa.getQuestion().getAnswers().stream()
                    .filter(a -> a.isCorrect()).map(a -> a.getContent())
                    .findFirst().orElse("?");
            return AiExplanationResponse.builder()
                    .attemptAnswerId(aa.getId())
                    .questionId(aa.getQuestion().getId())
                    .questionContent(aa.getQuestion().getContent())
                    .yourAnswer(aa.getSelectedAnswer() != null ? aa.getSelectedAnswer().getContent() : "(không chọn)")
                    .correctAnswer(correct)
                    .explanation("AI chưa được cấu hình.")
                    .tip("")
                    .build();
        }).collect(Collectors.toList());
        return AiExplanationResponse.Summary.builder()
                .explanations(list).overallFeedback("").weakTopics(List.of()).build();
    }

    /**
     * Gợi ý điểm tất cả câu tự luận chưa chấm — CHỈ 1 request duy nhất.
     */
    public List<AiSuggestionResponse> suggestGrades(Long attemptId) {
        Attempt attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> new AppException(ErrorCode.ATTEMPT_NOT_FOUND));

        List<AttemptAnswer> essays = attempt.getAnswers().stream()
                .filter(aa -> aa.getQuestion().getType().name().equals("ESSAY"))
                .filter(aa -> aa.getScore() == null)
                .collect(Collectors.toList());

        if (essays.isEmpty()) return List.of();

        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            log.warn("Gemini API key chưa cấu hình");
            return fallback(essays, "AI chưa được cấu hình. Vui lòng chấm thủ công.");
        }

        // Map questionId → điểm tối đa — tạo 1 lần O(n)
        Map<Long, Double> maxScoreMap = new HashMap<>();
        if (attempt.getExam() != null) {
            attempt.getExam().getExamQuestions().forEach(eq ->
                    maxScoreMap.put(eq.getQuestion().getId(),
                            eq.getScore() != null ? eq.getScore() : 1.0));
        }

        // Map answerId → AttemptAnswer — tạo 1 lần O(n), dùng khi parse O(1)
        Map<Long, AttemptAnswer> answerMap = essays.stream()
                .collect(Collectors.toMap(AttemptAnswer::getId, aa -> aa));

        return suggestBatch(essays, answerMap, maxScoreMap);
    }

    // ── Core: 1 request cho tất cả câu ──────────────────────
    private List<AiSuggestionResponse> suggestBatch(
            List<AttemptAnswer> essays,
            Map<Long, AttemptAnswer> answerMap,
            Map<Long, Double> maxScoreMap) {
        try {
            String prompt = buildBatchPrompt(essays, maxScoreMap);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = Map.of(
                    "contents", List.of(Map.of(
                            "parts", List.of(Map.of("text", prompt))
                    ))
            );

            String url = getGeminiUrl() + "?key=" + geminiApiKey;
            ResponseEntity<String> resp = restTemplate.postForEntity(
                    url, new HttpEntity<>(body, headers), String.class);

            return parseBatchResponse(resp.getBody(), essays, answerMap, maxScoreMap);

        } catch (Exception e) {
            log.error("AI batch grading failed: {}", e.getMessage());
            return fallback(essays, "Không thể kết nối AI. Vui lòng chấm thủ công.");
        }
    }

    // ── Prompt: gom tất cả câu vào 1 prompt ─────────────────
    private String buildBatchPrompt(List<AttemptAnswer> essays, Map<Long, Double> maxScoreMap) {
        StringBuilder sb = new StringBuilder();
        sb.append("""
            Bạn là giáo viên chấm bài tự luận. Đánh giá các câu sau.
            Return ONLY a valid JSON array. Do NOT include explanation text. Do NOT use markdown or ```.

            """);

        for (int i = 0; i < essays.size(); i++) {
            AttemptAnswer aa = essays.get(i);
            double max = maxScoreMap.getOrDefault(aa.getQuestion().getId(), 1.0);
            sb.append(String.format(
                    "--- Câu %d | id=%d | điểm tối đa=%.1f ---\nCâu hỏi: %s\nTrả lời: %s\n\n",
                    i + 1, aa.getId(), max,
                    aa.getQuestion().getContent(),
                    aa.getTextAnswer() != null ? aa.getTextAnswer() : "(không trả lời)"
            ));
        }

        sb.append("""
            JSON format (mỗi phần tử tương ứng 1 câu theo id):
            [{"id":<answerId>,"score":<số thực 0→max>,"confidence":"HIGH|MEDIUM|LOW","comment":"<tiếng Việt, ≤80 từ>"}]

            Tiêu chí confidence: HIGH=rõ đúng/sai, MEDIUM=có thể tranh luận, LOW=mơ hồ.
            """);

        return sb.toString();
    }

    // ── Parse: O(1) per item nhờ answerMap ───────────────────
    private List<AiSuggestionResponse> parseBatchResponse(
            String responseBody,
            List<AttemptAnswer> essays,
            Map<Long, AttemptAnswer> answerMap,
            Map<Long, Double> maxScoreMap) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String text   = root.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText();

            // Strip markdown phòng trường hợp Gemini vẫn thêm vào
            text = text.replaceAll("(?s)```json|```", "").trim();

            JsonNode array = objectMapper.readTree(text);
            Map<Long, AiSuggestionResponse> resultMap = new HashMap<>();

            for (JsonNode node : array) {
                long id = node.path("id").asLong();

                // O(1) lookup thay vì O(n) stream
                AttemptAnswer aa = answerMap.get(id);
                if (aa == null) continue;

                double maxScore = maxScoreMap.getOrDefault(aa.getQuestion().getId(), 1.0);
                double score    = Math.min(node.path("score").asDouble(0), maxScore);
                score           = Math.round(score * 10.0) / 10.0;

                resultMap.put(id, AiSuggestionResponse.builder()
                        .attemptAnswerId(id)
                        .suggestedScore(score)
                        .confidence(node.path("confidence").asText("MEDIUM"))
                        .comment(node.path("comment").asText(""))
                        .build());
            }

            // Đảm bảo trả đủ kể cả câu AI bỏ sót
            return essays.stream().map(aa ->
                    resultMap.getOrDefault(aa.getId(), AiSuggestionResponse.builder()
                            .attemptAnswerId(aa.getId())
                            .suggestedScore(null)
                            .confidence("LOW")
                            .comment("AI không phân tích được câu này.")
                            .build())
            ).collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Failed to parse batch AI response: {}", e.getMessage());
            return fallback(essays, "Không thể phân tích phản hồi AI.");
        }
    }

    // ── Fallback khi có lỗi ───────────────────────────────────
    private List<AiSuggestionResponse> fallback(List<AttemptAnswer> essays, String msg) {
        return essays.stream().map(aa -> AiSuggestionResponse.builder()
                .attemptAnswerId(aa.getId())
                .suggestedScore(null)
                .confidence("LOW")
                .comment(msg)
                .build()).collect(Collectors.toList());
    }

    public void clearWeaknessCache(Long studentId) {
        try { redis.delete("ai:weakness:" + studentId); } catch (Exception ignored) {}
    }

    // ── Analyze student weakness ──────────────────────────
    public WeaknessAnalysis analyzeWeakness(Long studentId) {
        String cacheKey = "ai:weakness:" + studentId;
        try {
            String cached = redis.opsForValue().get(cacheKey);
            if (cached != null)
                return objectMapper.readValue(cached, WeaknessAnalysis.class);
        } catch (Exception ignored) {}

        List<Attempt> attempts = attemptRepo.findGradedWithAnswersByStudent(studentId);

        if (attempts.isEmpty())
            return new WeaknessAnalysis(List.of(), "Chưa có đủ dữ liệu để phân tích.", List.of(), List.of());

        // Tính tỉ lệ đúng theo từng tag
        Map<String, int[]> tagStats = new java.util.LinkedHashMap<>();
        int totalWrong = 0;
        for (var attempt : attempts) {
            for (var aa : attempt.getAnswers()) {
                if (aa.getQuestion() == null) continue;
                boolean correct = Boolean.TRUE.equals(aa.getIsCorrect());
                if (!correct) totalWrong++;
                for (var tag : aa.getQuestion().getTags()) {
                    tagStats.computeIfAbsent(tag.getName(), k -> new int[]{0, 0});
                    tagStats.get(tag.getName())[0]++;
                    if (correct) tagStats.get(tag.getName())[1]++;
                }
            }
        }

        List<TopicStat> topics = tagStats.entrySet().stream()
                .filter(e -> e.getValue()[0] >= 3)
                .map(e -> {
                    int total = e.getValue()[0], correct = e.getValue()[1];
                    int pct = (int) Math.round((double) correct / total * 100);
                    return new TopicStat(e.getKey(), total, correct, pct);
                })
                .sorted(java.util.Comparator.comparingInt(TopicStat::correctPct))
                .limit(8)
                .collect(Collectors.toList());

        String advice;
        List<RoadmapItem> roadmap = List.of();
        if (geminiApiKey != null && !geminiApiKey.isBlank() && !topics.isEmpty()) {
            AiAdviceResult aiResult = callAiForAdvice(topics, attempts.size(), totalWrong);
            advice = aiResult.advice();
            roadmap = aiResult.roadmap();
        } else {
            List<String> weak = topics.stream().filter(t -> t.correctPct() < 60).map(TopicStat::topic).toList();
            advice = weak.isEmpty()
                    ? "Bạn đang học tốt! Tiếp tục duy trì."
                    : "Bạn cần ôn tập thêm: " + String.join(", ", weak) + ".";
        }

        List<String> suggestions = topics.stream()
                .filter(t -> t.correctPct() < 60)
                .map(t -> t.topic() + " (" + t.correctPct() + "% đúng)")
                .toList();

        WeaknessAnalysis result = new WeaknessAnalysis(topics, advice, suggestions, roadmap);
        try {
            redis.opsForValue().set(cacheKey, objectMapper.writeValueAsString(result), Duration.ofHours(2));
        } catch (Exception ignored) {}
        return result;
    }

    /** Gọi AI để lấy lộ trình học tập có cấu trúc */
    private AiAdviceResult callAiForAdvice(List<TopicStat> topics, int totalAttempts, int totalWrong) {
        try {
            StringBuilder sb = new StringBuilder();
            sb.append("Student đã làm ").append(totalAttempts)
                    .append(" bài thi, sai ").append(totalWrong).append(" câu.\n");
            sb.append("Thống kê theo chủ đề:\n");
            topics.forEach(t -> sb.append(String.format("- %s: %d/%d đúng (%d%%)\n",
                    t.topic(), t.correct(), t.total(), t.correctPct())));
            sb.append("""

                Hãy phân tích và trả về JSON (không markdown):
                {
                  "advice": "<nhận xét tổng thể 1-2 câu tiếng Việt>",
                  "roadmap": [
                    {
                      "topic": "<tên chủ đề>",
                      "priority": "HIGH|MEDIUM|LOW",
                      "action": "<việc cần làm cụ thể, 1 câu>",
                      "keywords": ["<từ khóa 1>", "<từ khóa 2>", "<từ khóa 3>"]
                    }
                  ]
                }
                Chỉ đưa chủ đề có tỉ lệ đúng < 70% vào roadmap. Tối đa 5 mục.
                """);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            Map<String, Object> body = Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", sb.toString()))))
            );
            ResponseEntity<String> resp = restTemplate.postForEntity(
                    getGeminiUrl() + "?key=" + geminiApiKey,
                    new HttpEntity<>(body, headers), String.class);
            JsonNode root = objectMapper.readTree(resp.getBody());
            String text = root.path("candidates").get(0)
                    .path("content").path("parts").get(0).path("text").asText("");
            text = text.replaceAll("(?s)```json|```", "").trim();

            JsonNode json = objectMapper.readTree(text);
            String advice = json.path("advice").asText("");

            List<RoadmapItem> roadmap = new ArrayList<>();
            for (JsonNode item : json.path("roadmap")) {
                List<String> kws = new ArrayList<>();
                item.path("keywords").forEach(k -> kws.add(k.asText()));
                roadmap.add(new RoadmapItem(
                        item.path("topic").asText(),
                        item.path("priority").asText("MEDIUM"),
                        item.path("action").asText(""),
                        kws));
            }
            return new AiAdviceResult(advice, roadmap);
        } catch (Exception e) {
            log.warn("[AiWeakness] advice failed: {}", e.getMessage());
            return new AiAdviceResult("", List.of());
        }
    }

    private record AiAdviceResult(String advice, List<RoadmapItem> roadmap) {}

    public record TopicStat(String topic, int total, int correct, int correctPct) {}

    public record WeaknessAnalysis(
            List<TopicStat> topics,
            String          advice,
            List<String>    suggestions,
            List<RoadmapItem> roadmap
    ) {}

    public record RoadmapItem(
            String topic,
            String priority,   // HIGH | MEDIUM | LOW
            String action,     // việc cần làm cụ thể
            List<String> keywords  // từ khóa cần học
    ) {}

    // ── Grade essay cho practice quiz (không lưu DB) ──────
    public record EssayGradeRequest(String question, String studentAnswer, String suggestedAnswer) {}
    public record EssayGradeResult(int score, int maxScore, String feedback, String level) {}

    public EssayGradeResult gradePracticeEssay(EssayGradeRequest req) {
        if (geminiApiKey == null || geminiApiKey.isBlank())
            return new EssayGradeResult(0, 10, "AI chưa được cấu hình.", "UNKNOWN");

        try {
            String prompt = String.format("""
                Chấm câu trả lời tự luận sau. Cho điểm từ 0-10.
                Câu hỏi: %s
                Gợi ý đáp án: %s
                Câu trả lời của sinh viên: %s
                
                Return ONLY valid JSON (no markdown):
                {
                  "score": <số nguyên 0-10>,
                  "feedback": "<nhận xét ngắn ≤40 từ, tiếng Việt>",
                  "level": "EXCELLENT|GOOD|AVERAGE|POOR"
                }
                """, req.question(), req.suggestedAnswer(), req.studentAnswer());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            Map<String, Object> body = Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))));
            ResponseEntity<String> resp = restTemplate.postForEntity(
                    getGeminiUrl() + "?key=" + geminiApiKey,
                    new HttpEntity<>(body, headers), String.class);

            JsonNode root = objectMapper.readTree(resp.getBody());
            String text = root.path("candidates").get(0)
                    .path("content").path("parts").get(0).path("text").asText();
            text = text.replaceAll("(?s)```json|```", "").trim();
            JsonNode json = objectMapper.readTree(text);

            return new EssayGradeResult(
                    Math.min(10, Math.max(0, json.path("score").asInt(0))),
                    10,
                    json.path("feedback").asText(""),
                    json.path("level").asText("AVERAGE"));
        } catch (Exception e) {
            log.warn("[AiGrade] essay grade failed: {}", e.getMessage());
            return new EssayGradeResult(0, 10, "AI không thể chấm. Tự đánh giá theo gợi ý.", "UNKNOWN");
        }
    }
}