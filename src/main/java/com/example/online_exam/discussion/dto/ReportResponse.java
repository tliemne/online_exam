package com.example.online_exam.discussion.dto;

import com.example.online_exam.discussion.enums.ReportStatus;
import com.example.online_exam.discussion.enums.ViolationType;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ReportResponse {
    private Long id;
    private ViolationType violationType;
    private String details;
    private ReportStatus status;
    private String resolutionNote;
    private Long reporterId;
    private String reporterUsername;
    private Long postId;
    private String postTitle;
    private String postContent;
    private Long replyId;
    private String replyContent;
    private Long authorId;
    private String authorUsername;
    private String authorFullName;
    private Long courseId;
    private String courseName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long reviewedById;
    private String reviewedByUsername;
    private Long reportCount;
}
