package com.example.online_exam.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketEvent {
    private String type;           // exam:attempt:progress, notification:new, etc.
    private Object data;
    private LocalDateTime timestamp;
    private String userId;         // Optional: for targeted messages
}
