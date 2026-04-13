package com.example.online_exam.attempt.service;

import com.example.online_exam.attempt.dto.ExamStatsResponse;
import com.example.online_exam.attempt.dto.ExamStatsResponse.*;
import com.example.online_exam.attempt.entity.Attempt;
import com.example.online_exam.attempt.repository.AttemptRepository;
//import com.example.online_exam.common.exception.AppException;
//import com.example.online_exam.common.exception.ErrorCode;
import com.example.online_exam.exam.entity.Exam;
import com.example.online_exam.exam.repository.ExamRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.question.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamStatsServiceImpl implements ExamStatsService {

    private final AttemptRepository attemptRepo;
    private final ExamRepository    examRepo;
    private final QuestionRepository questionRepo;

    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Override
    @Transactional(readOnly = true)
    public ExamStatsResponse getExamStats(Long examId) {
        Exam exam = examRepo.findById(examId)
                .orElseThrow(() -> new AppException(ErrorCode.EXAM_NOT_FOUND));

        List<Attempt> attempts = attemptRepo.findGradedByExam(examId);
        double totalScoreMax = exam.getTotalScore() != null ? exam.getTotalScore() : 10.0;

        if (attempts.isEmpty()) {
            return ExamStatsResponse.builder()
                    .examId(examId).examTitle(exam.getTitle())
                    .totalAttempts(0).passCount(0).failCount(0)
                    .passRate(0).avgScore(0).maxScore(0).minScore(0)
                    .totalScoreMax(totalScoreMax)
                    .leaderboard(List.of())
                    .scoreDistribution(buildEmptyHistogram(totalScoreMax))
                    .questionStats(List.of())
                    .build();
        }

        // ── Tổng quan ───────────────────────────────────────────────────────
        int passCount = (int) attempts.stream().filter(a -> Boolean.TRUE.equals(a.getPassed())).count();
        int failCount = attempts.size() - passCount;
        double avg = attempts.stream().mapToDouble(a -> a.getScore() != null ? a.getScore() : 0.0).average().orElse(0);
        double max = attempts.stream().mapToDouble(a -> a.getScore() != null ? a.getScore() : 0.0).max().orElse(0);
        double min = attempts.stream().mapToDouble(a -> a.getScore() != null ? a.getScore() : 0.0).min().orElse(0);
        double passRate = attempts.isEmpty() ? 0 :
                Math.round(passCount * 1000.0 / attempts.size()) / 10.0;

        // ── Leaderboard Top 10 (đã sort desc theo score) ────────────────────
        List<LeaderboardEntry> leaderboard = new ArrayList<>();
        int rank = 1;
        for (Attempt a : attempts.subList(0, Math.min(10, attempts.size()))) {
            // ✅ FIX: Skip attempts with null score (essay not graded yet)
            if (a.getScore() == null) continue;
            
            Double score = a.getScore();
            String code = a.getStudent().getStudentProfile() != null
                    ? a.getStudent().getStudentProfile().getStudentCode() : "";
            leaderboard.add(LeaderboardEntry.builder()
                    .rank(rank++)
                    .studentId(a.getStudent().getId())
                    .studentName(a.getStudent().getFullName())
                    .studentCode(code)
                    .score(score)
                    .totalScore(totalScoreMax)
                    .passed(Boolean.TRUE.equals(a.getPassed()))
                    .tabViolations(a.getTabViolationCount() != null ? a.getTabViolationCount() : 0)
                    .submittedAt(a.getSubmittedAt() != null ? a.getSubmittedAt().format(FMT) : "")
                    .build());
        }

        // ── Histogram phân phối điểm ─────────────────────────────────────────
        List<ScoreBucket> distribution = buildHistogram(attempts, totalScoreMax);

        // ── Điểm TB theo câu hỏi ────────────────────────────────────────────
        // ✅ FIX: Lấy stats theo exam, không theo course (để chính xác hơn)
        List<Object[]> qRows = attemptRepo.findQuestionStatsByExam(examId);
        
        List<QuestionStat> questionStats = new ArrayList<>();
        if (qRows != null) {
            for (Object[] row : qRows) {
                Long qId = ((Number) row[0]).longValue();
                int total = ((Number) row[1]).intValue();
                int correct = ((Number) row[2]).intValue();
                double avgScore = ((Number) row[3]).doubleValue();
                double rate = total == 0 ? 0 : Math.round(correct * 1000.0 / total) / 10.0;

                String content = questionRepo.findById(qId)
                        .map(q -> q.getContent().length() > 80
                                ? q.getContent().substring(0, 80) + "..." : q.getContent())
                        .orElse("Câu " + qId);

                questionStats.add(QuestionStat.builder()
                        .questionId(qId)
                        .questionContent(content)
                        .totalAnswered(total)
                        .correctCount(correct)
                        .correctRate(rate)
                        .avgScore(Math.round(avgScore * 100.0) / 100.0)
                        .build());
            }
        }

        return ExamStatsResponse.builder()
                .examId(examId).examTitle(exam.getTitle())
                .totalAttempts(attempts.size())
                .passCount(passCount).failCount(failCount)
                .passRate(passRate)
                .avgScore(Math.round(avg * 100.0) / 100.0)
                .maxScore(max).minScore(min)
                .totalScoreMax(totalScoreMax)
                .leaderboard(leaderboard)
                .scoreDistribution(distribution)
                .questionStats(questionStats)
                .build();
    }

    private List<ScoreBucket> buildHistogram(List<Attempt> attempts, double max) {
        int buckets = 5;
        double step = max / buckets;
        int[] counts = new int[buckets];
        for (Attempt a : attempts) {
            double s = a.getScore() != null ? a.getScore() : 0.0;
            int idx = (int) Math.min(s / step, buckets - 1);
            counts[idx]++;
        }
        List<ScoreBucket> list = new ArrayList<>();
        for (int i = 0; i < buckets; i++) {
            double lo = Math.round(i * step * 10) / 10.0;
            double hi = Math.round((i + 1) * step * 10) / 10.0;
            list.add(new ScoreBucket(lo + "-" + hi, counts[i]));
        }
        return list;
    }

    private List<ScoreBucket> buildEmptyHistogram(double max) {
        return buildHistogram(List.of(), max);
    }
}