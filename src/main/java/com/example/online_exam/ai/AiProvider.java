package com.example.online_exam.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * AI Provider với fallback: Gemini → Groq
 * Tự động chuyển sang Groq nếu Gemini fail
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiProvider {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String geminiModel;

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${groq.model:llama-3.1-70b-versatile}")
    private String groqModel;

    @Value("${groq.url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqUrl;

    @Value("${groq.temperature:0.3}")
    private double groqTemperature;

    /**
     * Gọi AI với fallback tự động
     * @param prompt Prompt text
     * @return Response text từ AI
     */
    public String generate(String prompt) {
        // Try Gemini first
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            try {
                String result = callGemini(prompt);
                if (result != null && !result.isBlank()) {
                    log.debug("[AiProvider] Gemini success");
                    return result;
                }
            } catch (Exception e) {
                log.warn("[AiProvider] Gemini failed: {} - Falling back to Groq", e.getMessage());
            }
        }

        // Fallback to Groq
        if (groqApiKey != null && !groqApiKey.isBlank()) {
            try {
                String result = callGroq(prompt);
                if (result != null && !result.isBlank()) {
                    log.info("[AiProvider] Groq fallback success");
                    return result;
                }
            } catch (Exception e) {
                log.error("[AiProvider] Groq also failed: {}", e.getMessage());
            }
        }

        log.error("[AiProvider] All AI providers failed");
        return null;
    }

    /**
     * Gọi Gemini API với retry
     */
    private String callGemini(String prompt) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + geminiModel + ":generateContent?key=" + geminiApiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
        );

        // Retry up to 3 times on 503
        ResponseEntity<String> resp = null;
        for (int attempt = 0; attempt < 3; attempt++) {
            try {
                resp = restTemplate.postForEntity(
                        url, new HttpEntity<>(body, headers), String.class);
                break; // success
            } catch (org.springframework.web.client.HttpServerErrorException e) {
                if (e.getStatusCode().value() == 503 && attempt < 2) {
                    long waitTime = (long) Math.pow(2, attempt) * 1000; // 1s, 2s
                    log.warn("[AiProvider] Gemini 503 retry {}/2, waiting {}ms", attempt + 1, waitTime);
                    Thread.sleep(waitTime);
                } else {
                    throw e;
                }
            }
        }

        if (resp == null || resp.getBody() == null) {
            throw new RuntimeException("No response from Gemini");
        }

        JsonNode root = objectMapper.readTree(resp.getBody());
        return root.path("candidates").get(0)
                .path("content").path("parts").get(0)
                .path("text").asText("");
    }

    /**
     * Gọi Groq API (OpenAI format)
     */
    private String callGroq(String prompt) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + groqApiKey);

        // System prompt để Groq trả lời giống Gemini
        String systemPrompt = """
            Bạn là trợ lý AI cho hệ thống thi trực tuyến, chuyên về giáo dục.
            
            QUY TẮC QUAN TRỌNG:
            1. Luôn trả lời bằng tiếng Việt
            2. Khi được yêu cầu trả về JSON, chỉ trả JSON thuần túy, KHÔNG thêm markdown (```json)
            3. Trả lời ngắn gọn, súc tích, đúng trọng tâm
            4. Với câu hỏi trắc nghiệm: tạo đúng format JSON được yêu cầu
            5. Với giải thích: dùng ngôn ngữ dễ hiểu, phù hợp sinh viên
            6. KHÔNG thêm text giải thích bên ngoài JSON khi được yêu cầu JSON
            
            Hãy tuân thủ chặt chẽ format được yêu cầu trong prompt.
            """;

        Map<String, Object> body = Map.of(
                "model", groqModel,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", prompt)
                ),
                "temperature", groqTemperature,  // Configurable temperature
                "max_tokens", 2048
        );

        // Retry up to 3 times
        ResponseEntity<String> resp = null;
        for (int attempt = 0; attempt < 3; attempt++) {
            try {
                resp = restTemplate.postForEntity(
                        groqUrl, new HttpEntity<>(body, headers), String.class);
                break; // success
            } catch (Exception e) {
                if (attempt < 2) {
                    long waitTime = (long) Math.pow(2, attempt) * 1000;
                    log.warn("[AiProvider] Groq retry {}/2, waiting {}ms", attempt + 1, waitTime);
                    Thread.sleep(waitTime);
                } else {
                    throw e;
                }
            }
        }

        if (resp == null || resp.getBody() == null) {
            throw new RuntimeException("No response from Groq");
        }

        JsonNode root = objectMapper.readTree(resp.getBody());
        return root.path("choices").get(0)
                .path("message").path("content").asText("");
    }

    /**
     * Check xem có AI provider nào available không
     */
    public boolean isAvailable() {
        return (geminiApiKey != null && !geminiApiKey.isBlank())
                || (groqApiKey != null && !groqApiKey.isBlank());
    }

    /**
     * Get tên provider đang dùng (để log/debug)
     */
    public String getActiveProvider() {
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            return "Gemini (primary)";
        }
        if (groqApiKey != null && !groqApiKey.isBlank()) {
            return "Groq (fallback)";
        }
        return "None";
    }
}
