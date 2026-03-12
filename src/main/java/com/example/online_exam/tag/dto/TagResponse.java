package com.example.online_exam.tag.dto;

import lombok.Data;

@Data
public class TagResponse {
    private Long id;
    private String name;
    private String description;
    private String color;
    private long questionCount;
}