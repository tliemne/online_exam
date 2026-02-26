package com.example.online_exam.course.dto;

import lombok.Data;

@Data
public class CourseRequest {
    private String name;
    private String description;
    private Long teacherId;
}