package com.example.online_exam.attempt.dto;

import lombok.*;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CourseLeaderboardResponse {

    private Long   courseId;
    private String courseName;
    private int    totalStudents;   // số SV đã thi ít nhất 1 bài
    private int    totalExams;      // số đề thi trong lớp

    private List<StudentRankEntry> ranking;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class StudentRankEntry {
        private int    rank;
        private Long   studentId;
        private String studentName;
        private String studentCode;
        private int    examsTaken;    // số bài đã thi
        private int    examsPasssed;  // số bài đạt
        private double avgScore;      // điểm TB (theo %)
        private double bestScore;     // điểm cao nhất (tuyệt đối)
        private double bestScoreMax;  // tổng điểm của bài cao nhất
        private String lastExamTitle; // tên bài thi gần nhất
    }
}