package com.example.online_exam.discussion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DiscussionReplyRequest {

    @NotBlank
    @Size(max = 5000, message = "Reply content must not exceed 5000 characters")
    private String content;
    
    private Long parentReplyId; // Optional: for nested replies
}
