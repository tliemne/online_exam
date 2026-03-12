package com.example.online_exam.attempt.controller;

import com.example.online_exam.attempt.dto.ExamStatsResponse;
import com.example.online_exam.attempt.service.ExamStatsService;
import com.example.online_exam.common.dto.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;


@RestController
@RequestMapping("/exam-stats")
@RequiredArgsConstructor
public class ExamStatsController {

    private final ExamStatsService statsService;

    // Teacher + Admin xem thống kê đầy đủ
    @GetMapping("/{examId}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public BaseResponse<ExamStatsResponse> getStats(@PathVariable Long examId) {
        return ok(statsService.getExamStats(examId));
    }

    // Student xem leaderboard sau khi nộp bài (không thấy chi tiết)
    @GetMapping("/{examId}/leaderboard")
    @PreAuthorize("hasAnyRole('STUDENT','TEACHER','ADMIN')")
    public BaseResponse<ExamStatsResponse> getLeaderboard(@PathVariable Long examId) {
        ExamStatsResponse full = statsService.getExamStats(examId);
        // Student chỉ thấy leaderboard + tổng quan, ẩn questionStats
        ExamStatsResponse leaderboardOnly = ExamStatsResponse.builder()
                .examId(full.getExamId()).examTitle(full.getExamTitle())
                .totalAttempts(full.getTotalAttempts())
                .passCount(full.getPassCount()).failCount(full.getFailCount())
                .passRate(full.getPassRate()).avgScore(full.getAvgScore())
                .maxScore(full.getMaxScore()).minScore(full.getMinScore())
                .totalScoreMax(full.getTotalScoreMax())
                .leaderboard(full.getLeaderboard())
                .scoreDistribution(full.getScoreDistribution())
                .questionStats(null)
                .build();
        return ok(leaderboardOnly);
    }
    private <T> BaseResponse<T> ok(T data) {
        return BaseResponse.<T>builder()
                .status(200).message("success")
                .data(data).timestamp(LocalDateTime.now()).build();
    }
}