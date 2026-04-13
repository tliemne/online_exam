package com.example.online_exam.question.service;

import com.example.online_exam.attempt.entity.AttemptAnswer;
import com.example.online_exam.question.dto.QuestionStatResponse;
import com.example.online_exam.question.entity.Question;
import com.example.online_exam.question.entity.QuestionStat;
import com.example.online_exam.question.repository.QuestionRepository;
import com.example.online_exam.question.repository.QuestionStatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionStatService {

    private final QuestionStatRepository statRepo;
    private final QuestionRepository     questionRepo;

    private static final double THRESHOLD_EASY = 0.85;
    private static final double THRESHOLD_HARD = 0.30;
    private static final int MIN_ATTEMPTS = 2;

    /**
     * Nhận Map<questionId, isCorrect> — plain data, không phải entity.
     * ✅ Dùng CHỈ native SQL UPDATE — không dùng JPA save
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void updateStatsById(Map<Long, Boolean> questionCorrectMap) {
        if (questionCorrectMap == null || questionCorrectMap.isEmpty()) {
            log.warn("[QuestionStat] updateStatsById called with empty map");
            return;
        }
        log.info("[QuestionStat] ===== START updateStatsById with {} questions =====", questionCorrectMap.size());
        int successCount = 0;
        int failCount = 0;
        
        try {
            for (Map.Entry<Long, Boolean> entry : questionCorrectMap.entrySet()) {
                Long    questionId = entry.getKey();
                Boolean isCorrect  = entry.getValue();
                if (isCorrect == null) {
                    log.warn("[QuestionStat] Q={} has null isCorrect, skipping", questionId);
                    continue;
                }

                try {
                    // Kiểm tra xem stat có tồn tại không
                    Optional<QuestionStat> existing = statRepo.findByQuestionId(questionId);
                    
                    if (existing.isEmpty()) {
                        // Tạo mới bằng native SQL INSERT
                        int correctCount = isCorrect ? 1 : 0;
                        double rate = isCorrect ? 1.0 : 0.0;
                        String flag = rate >= 0.85 ? "TOO_EASY" : rate <= 0.30 ? "TOO_HARD" : "OK";
                        
                        // Dùng native SQL để tránh JPA merge
                        statRepo.createNewStat(questionId, 1, correctCount, rate, flag);
                        successCount++;
                        log.info("[QuestionStat] ✅ Q={} created: total=1 correct={} rate={} flag={}",
                                questionId, correctCount, rate, flag);
                    } else {
                        // Update bằng native SQL
                        int correctIncrement = isCorrect ? 1 : 0;
                        statRepo.incrementStats(questionId, correctIncrement);
                        successCount++;
                        log.info("[QuestionStat] ✅ Q={} updated via SQL", questionId);
                    }
                } catch (Exception e) {
                    failCount++;
                    log.error("[QuestionStat] ❌ Failed to update Q={}: {}", questionId, e.getMessage(), e);
                }
            }
            log.info("[QuestionStat] ===== END updateStatsById: {} success, {} failed =====", successCount, failCount);
        } catch (Exception e) {
            log.error("[QuestionStat] updateStatsById error: {}", e.getMessage(), e);
        }
    }

    // ── Query ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<QuestionStatResponse> getByCourse(Long courseId) {
        return statRepo.findByCourseId(courseId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<QuestionStatResponse> getFlaggedByCourse(Long courseId) {
        return statRepo.findFlaggedByCourseId(courseId).stream()
                .map(this::toResponse)
                .toList();
    }

    // ── Helper ────────────────────────────────────────────────────────────

    private QuestionStatResponse toResponse(QuestionStat s) {
        Question q = s.getQuestion();
        return QuestionStatResponse.builder()
                .questionId(s.getQuestionId())
                .questionContent(q != null
                        ? (q.getContent().length() > 100
                        ? q.getContent().substring(0, 100) + "..." : q.getContent())
                        : "")
                .questionType(q != null ? q.getType().name() : "")
                .difficulty(q != null ? q.getDifficulty().name() : "")
                .totalAttempts(s.getTotalAttempts())
                .correctCount(s.getCorrectCount())
                .correctRate(s.getCorrectRate())
                .difficultyFlag(s.getDifficultyFlag())
                .build();
    }
}