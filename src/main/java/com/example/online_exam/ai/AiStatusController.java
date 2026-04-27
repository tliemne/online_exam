package com.example.online_exam.ai;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller để check AI provider status
 * Dùng để test/debug AI configuration
 */
@RestController
@RequestMapping("/api/admin/ai")
@RequiredArgsConstructor
public class AiStatusController {

    private final AiProvider aiProvider;

    /**
     * Check AI provider status
     * GET /api/admin/ai/status
     */
    @GetMapping("/status")
    public ResponseEntity<?> getStatus() {
        return ResponseEntity.ok(Map.of(
                "available", aiProvider.isAvailable(),
                "activeProvider", aiProvider.getActiveProvider(),
                "message", aiProvider.isAvailable()
                        ? "AI provider is ready"
                        : "No AI provider configured. Add GEMINI_API_KEY or GROQ_API_KEY to application-env.properties"
        ));
    }

    /**
     * Test AI generation
     * POST /api/admin/ai/test
     * Body: {"prompt": "Test prompt"}
     */
    @PostMapping("/test")
    public ResponseEntity<?> testGeneration(@RequestBody Map<String, String> request) {
        if (!aiProvider.isAvailable()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "No AI provider configured"
            ));
        }

        String prompt = request.getOrDefault("prompt", "Viết 1 câu hỏi trắc nghiệm về Java");
        
        try {
            long startTime = System.currentTimeMillis();
            String response = aiProvider.generate(prompt);
            long duration = System.currentTimeMillis() - startTime;

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "provider", aiProvider.getActiveProvider(),
                    "duration_ms", duration,
                    "response", response != null ? response : "No response"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }
}
