package com.example.online_exam.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

public class DashboardResponse {

    // ── Admin ────────────────────────────────────────────
    @Data @Builder
    public static class Admin {
        private long totalUsers;
        private long totalStudents;
        private long totalTeachers;
        private long totalCourses;
        private long totalExams;
        private long totalAttempts;
        private long publishedExams;
        private double avgScore;          // trung bình điểm toàn hệ thống
        private double passRate;          // % bài đạt / tổng bài đã chấm
        private List<RecentAttempt> recentAttempts;
    }

    // ── Teacher ──────────────────────────────────────────
    @Data @Builder
    public static class Teacher {
        private long myCourses;
        private long myExams;
        private long publishedExams;
        private long pendingGrading;      // bài SUBMITTED chưa chấm
        private long totalAttempts;
        private double avgScore;
        private double passRate;
        private List<CourseStats> courseStats;
    }

    @Builder @NoArgsConstructor @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CourseStats {
        @JsonProperty("courseId")
        private Long   courseId;
        @JsonProperty("courseName")
        private String courseName;
        @JsonProperty("studentCount")
        private int    studentCount;
        @JsonProperty("examCount")
        private int    examCount;
        @JsonProperty("attemptCount")
        private int    attemptCount;
        @JsonProperty("passRate")
        private Integer passRate;

        public Long getCourseId() { return courseId; }
        public void setCourseId(Long courseId) { this.courseId = courseId; }
        public String getCourseName() { return courseName; }
        public void setCourseName(String courseName) { this.courseName = courseName; }
        public int getStudentCount() { return studentCount; }
        public void setStudentCount(int studentCount) { this.studentCount = studentCount; }
        public int getExamCount() { return examCount; }
        public void setExamCount(int examCount) { this.examCount = examCount; }
        public int getAttemptCount() { return attemptCount; }
        public void setAttemptCount(int attemptCount) { this.attemptCount = attemptCount; }
        public Integer getPassRate() { return passRate; }
        public void setPassRate(Integer passRate) { this.passRate = passRate; }
    }

    // ── Student ──────────────────────────────────────────
    @Data @Builder
    public static class Student {
        private long enrolledCourses;
        private long availableExams;     // đề PUBLISHED trong lớp của SV
        private long completedAttempts;
        private long passedAttempts;
        private Double avgScore;         // null nếu chưa thi lần nào
        private List<RecentAttempt> recentAttempts;
    }

    // ── Shared ───────────────────────────────────────────
    @Data @Builder
    public static class RecentAttempt {
        private Long   attemptId;
        private String examTitle;
        private String courseName;
        private String studentName;
        private Double score;
        private Double totalScore;
        private Boolean passed;
        private String status;
        private String submittedAt;
    }
}