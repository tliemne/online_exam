package com.example.online_exam.discussion.dto;

import lombok.Data;

import java.util.List;

@Data
public class DiscussionSearchRequest {

    private Long courseId;
    private String keyword;
    private List<String> tags;
    private Boolean answered;
    private String sortBy; // "date", "votes", "replies"
    private String sortDirection; // "asc", "desc"
}
