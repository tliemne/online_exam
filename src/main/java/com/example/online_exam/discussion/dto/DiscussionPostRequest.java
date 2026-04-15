package com.example.online_exam.discussion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class DiscussionPostRequest {

    @NotBlank
    @Size(min = 10, max = 200, message = "Post title must be between 10 and 200 characters")
    private String title;

    @NotBlank
    @Size(max = 10000, message = "Post content must not exceed 10000 characters")
    private String content;

    // courseId is set from path variable in controller, not from request body
    private Long courseId;

    @Size(max = 5, message = "A post can have at most 5 tags")
    private List<@Size(min = 2, max = 30, message = "Tag name must be between 2 and 30 characters") String> tags;
}
