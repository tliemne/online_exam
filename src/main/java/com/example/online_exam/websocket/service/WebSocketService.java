package com.example.online_exam.websocket.service;

import com.example.online_exam.websocket.dto.WebSocketEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Slf4j
@RequiredArgsConstructor
public class WebSocketService {
    private final SimpMessagingTemplate messagingTemplate;

    // Broadcast to all users
    public void broadcast(String eventType, Object data) {
        WebSocketEvent event = WebSocketEvent.builder()
                .type(eventType)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
        messagingTemplate.convertAndSend("/topic/broadcast", event);
        log.debug("Broadcast event: {}", eventType);
    }

    // Send to specific user
    public void sendToUser(String userId, String eventType, Object data) {
        WebSocketEvent event = WebSocketEvent.builder()
                .type(eventType)
                .data(data)
                .userId(userId)
                .timestamp(LocalDateTime.now())
                .build();
        // Use topic-based destination to avoid Spring's user destination transformation
        String destination = "/topic/user-" + userId;
        messagingTemplate.convertAndSend(destination, event);
        log.info("WebSocket: Sent to {} - type: {}", destination, eventType);
    }

    // Send to topic (e.g., course discussion, exam attempt)
    public void sendToTopic(String topic, String eventType, Object data) {
        WebSocketEvent event = WebSocketEvent.builder()
                .type(eventType)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
        messagingTemplate.convertAndSend("/topic/" + topic, event);
        log.debug("Send to topic {}: {}", topic, eventType);
    }
}
