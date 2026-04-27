package com.example.online_exam.discussion.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserViolationStatsDTO {
    private Long userId;
    private String username;
    private String fullName;
    private Long totalViolations;
    private Long warningCount;
    private Long muteCount;
    private Long banCount;
    private Long contentDeletedCount;
    private Boolean isCurrentlyBanned;
    private Boolean isCurrentlyMuted;
    private String suggestedAction;
}
