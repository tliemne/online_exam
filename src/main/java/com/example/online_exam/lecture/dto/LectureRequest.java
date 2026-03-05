package com.example.online_exam.lecture.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LectureRequest {
    @NotBlank
    private String title;
    private String description;
    private String videoUrl;
    private Integer orderIndex;
}