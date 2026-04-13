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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionStatService {

    private final QuestionStatRepository statRepo;
    private final QuestionRepository     questionRepo;

    private static final double THRESHOLD_EASY = 0.85;
    private static final double THRESHOLD_HARD = 0.30;
    // ========== BUG FIX 4: Giảm MIN_ATTEMPTS từ 5 xuống 2 ==========
    // CŨ: private static final int MIN_ATTEMPTS = 5;
    // MỚI: Giảm xuống 2 để 2 học sinh làm đã hiển thị dữ liệu
    private static final int    MIN_ATTEMPTS   = 2;
    // ========== END BUG FIX 4 ==========

    /**
     * Nhận Map<questionId, isCorrect> — plain data, không phải entity.
     * An toàn khi chạy @Async vì không cần Hibernate session.
     *
     * FIX: Code cũ nhận List<AttemptAnswer> rồi lazy-load aa.getQuestion()
     * trong thread mới → Hibernate session đã đóng → LazyInitializationException
     * → bị catch silent → KHÔNG GHI GÌ VÀO question_statistics.
     */
    @Async("statExecutor")
    @Transactional
    public void updateStatsById(Map<Long, Boolean> questionCorrectMap) {
        if (questionCorrectMap == null || questionCorrectMap.isEmpty()) return;
        try {
            for (Map.Entry<Long, Boolean> entry : questionCorrectMap.entrySet()) {
                Long    questionId = entry.getKey();
                Boolean isCorrect  = entry.getValue();
                if (isCorrect == null) continue;

                QuestionStat stat = statRepo.findByQuestionId(questionId)
                        .orElseGet(() -> {
                            Question q = questionRepo.findById(questionId).orElse(null);
                            if (q == null) return null;
                            QuestionStat s = new QuestionStat();
                            s.setQuestion(q);
                            s.setQuestionId(questionId);
                            return s;
                        });

                if (stat == null) continue;

                stat.setTotalAttempts(stat.getTotalAttempts() + 1);
                if (Boolean.TRUE.equals(isCorrect)) {
                    stat.setCorrectCount(stat.getCorrectCount() + 1);
                }

                double rate = stat.getTotalAttempts() == 0 ? 0.0
                        : (double) stat.getCorrectCount() / stat.getTotalAttempts();
                stat.setCorrectRate(Math.round(rate * 1000.0) / 1000.0);

                // ========== BUG FIX 4B: Fix logic phân loại độ khó ==========
                // CŨ (SAI):
                /*
                if (stat.getTotalAttempts() >= MIN_ATTEMPTS) {
                    if (rate >= THRESHOLD_EASY)      stat.setDifficultyFlag("TOO_EASY");
                    else if (rate <= THRESHOLD_HARD) stat.setDifficultyFlag("TOO_HARD");
                    else                             stat.setDifficultyFlag("OK");
                }
                */
                
                // MỚI (ĐÚNG):
                // Luôn phân loại (không cần chờ MIN_ATTEMPTS)
                // 0% đúng (rate = 0.0) phải là TOO_HARD
                if (rate >= THRESHOLD_EASY) {
                    stat.setDifficultyFlag("TOO_EASY");
                } else if (rate <= THRESHOLD_HARD) {
                    stat.setDifficultyFlag("TOO_HARD");
                } else {
                    stat.setDifficultyFlag("OK");
                }
                // ========== END BUG FIX 4B ==========

                statRepo.save(stat);
                log.info("[QuestionStat] q={} total={} rate={} flag={}",
                        questionId, stat.getTotalAttempts(),
                        stat.getCorrectRate(), stat.getDifficultyFlag());
            }
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
