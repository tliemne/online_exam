package com.example.online_exam.course.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class CourseRequest {
    @NotBlank
    private String name;
    private String description;
    private List<Long> teacherIds; // Optional - Admin chọn giáo viên, Teacher tự động là giáo viên
}