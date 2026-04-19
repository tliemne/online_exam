package com.example.online_exam.course.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CourseRequest {
    @NotBlank
    private String name;
    private String description;
    @NotEmpty(message = "Phải chọn ít nhất một giảng viên")
    private List<Long> teacherIds;
}