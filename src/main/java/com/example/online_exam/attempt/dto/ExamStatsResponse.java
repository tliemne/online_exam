package com.example.online_exam.attempt.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
@lombok.Setter
public class ExamStatsResponse {

    // Tổng quan
    private Long examId;
    private String examTitle;
    private int totalAttempts;       // tổng bài nộp
    private int passCount;           // số đạt
    private int failCount;           // số trượt
    private double passRate;         // % đạt
    private double avgScore;         // điểm TB
    private double maxScore;         // cao nhất
    private double minScore;         // thấp nhất
    private double totalScoreMax;    // điểm tối đa của đề

    // Top 10 leaderboard
    private List<LeaderboardEntry> leaderboard;

    // Phân phối điểm (histogram)
    private List<ScoreBucket> scoreDistribution;

    // Điểm TB theo từng câu hỏi
    private List<QuestionStat> questionStats;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class LeaderboardEntry {
        private int rank;
        private Long studentId;
        private String studentName;
        private String studentCode;
        private double score;
        private double totalScore;
        private boolean passed;
        private int tabViolations;
        private String submittedAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ScoreBucket {
        private String label;   // "0-1", "1-2", ...
        private int count;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class QuestionStat {
        private Long questionId;
        private String questionContent;
        private int totalAnswered;
        private int correctCount;
        private double correctRate;   // % đúng
        private double avgScore;
    }
}