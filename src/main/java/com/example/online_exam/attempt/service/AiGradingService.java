package com.example.online_exam.attempt.service;

import com.example.online_exam.attempt.dto.AiSuggestionResponse;
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
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiGradingService {

    private final AttemptRepository attemptRepo;
    private final ObjectMapper      objectMapper;
    private final RestTemplate      restTemplate;   // inject bean có timeout

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

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

            String url = GEMINI_URL + "?key=" + geminiApiKey;
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
}