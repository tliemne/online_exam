package com.example.online_exam.course.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseResponse {
    private Long id;
    private String name;
    private String description;

    // Người tạo lớp
    private Long createdById;
    private String createdByName;

    // Danh sách giáo viên quản lý
    private List<TeacherInfo> teachers;

    private Integer studentCount;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeacherInfo {
        private Long id;
        private String fullName;
        private String username;
    }
}
