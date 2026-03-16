package com.example.online_exam.dashboard.dto;

import lombok.Builder;
import lombok.Data;

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

    @Data @Builder
    public static class CourseStats {
        private Long   courseId;
        private String courseName;
        private int    studentCount;
        private int    examCount;
        private int    attemptCount;
        private Integer passRate;   // % bài đạt, null nếu chưa có attempt
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