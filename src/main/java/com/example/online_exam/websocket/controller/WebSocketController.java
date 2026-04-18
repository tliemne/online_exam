package com.example.online_exam.websocket.controller;

import com.example.online_exam.attempt.dto.SubmitAnswerItem;
import com.example.online_exam.attempt.service.AttemptService;
import com.example.online_exam.secutity.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketController {

    private final AttemptService attemptService;
    private final CurrentUserService currentUserService;

    /**
     * Handle exam heartbeat via WebSocket
     * Client sends: /app/attempts/{attemptId}/heartbeat
     */
    @MessageMapping("/attempts/{attemptId}/heartbeat")
    public void handleHeartbeat(
            @DestinationVariable Long attemptId,
            @Payload Map<String, Object> payload) {
        try {
            int timeRemainingSeconds = ((Number) payload.getOrDefault("timeRemainingSeconds", 0)).intValue();
            int tabViolationCount = ((Number) payload.getOrDefault("tabViolationCount", 0)).intValue();
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> answersData = (List<Map<String, Object>>) payload.get("answers");
            
            List<SubmitAnswerItem> answers = answersData.stream()
                    .map(a -> {
                        SubmitAnswerItem item = new SubmitAnswerItem();
                        item.setQuestionId(((Number) a.get("questionId")).longValue());
                        item.setAnswerId(a.get("answerId") != null ? ((Number) a.get("answerId")).longValue() : null);
                        item.setTextAnswer((String) a.get("textAnswer"));
                        return item;
                    })
                    .toList();
            
            attemptService.heartbeat(attemptId, timeRemainingSeconds, tabViolationCount, answers);
            log.debug("Heartbeat received for attempt: {}", attemptId);
        } catch (Exception e) {
            log.error("Error handling heartbeat for attempt {}: {}", attemptId, e.getMessage());
        }
    }
}
