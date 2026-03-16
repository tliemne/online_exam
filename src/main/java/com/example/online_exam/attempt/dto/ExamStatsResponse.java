package com.example.online_exam.attempt.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
@lombok.Setter
public class ExamStatsResponse {


    private Long examId;
    private String examTitle;
    private int totalAttempts;
    private int passCount;
    private int failCount;
    private double passRate;
    private double avgScore;
    private double maxScore;
    private double minScore;
    private double totalScoreMax;


    private List<LeaderboardEntry> leaderboard;


    private List<ScoreBucket> scoreDistribution;


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
        private double correctRate;
        private double avgScore;
    }
}