package com.example.online_exam.course.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
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
    
    // Thông tin người tạo đầy đủ
    private CreatorInfo createdBy;

    // Danh sách giáo viên quản lý
    private List<TeacherInfo> teachers;
    
    // Danh sách sinh viên (chỉ trả về khi cần)
    private List<StudentInfo> students;

    private Integer studentCount;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeacherInfo {
        private Long id;
        private String fullName;
        private String username;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentInfo {
        private Long id;
        private String fullName;
        private String username;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreatorInfo {
        private Long id;
        private String fullName;
        private String username;
    }
}
