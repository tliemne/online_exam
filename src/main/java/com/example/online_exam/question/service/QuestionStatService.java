package com.example.online_exam.question.service;

import com.example.online_exam.attempt.entity.AttemptAnswer;
import com.example.online_exam.question.dto.QuestionStatResponse;
import com.example.online_exam.question.entity.Question;
import com.example.online_exam.question.entity.QuestionStat;
import com.example.online_exam.question.repository.QuestionStatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionStatService {

    private final QuestionStatRepository statRepo;

    private static final double THRESHOLD_EASY = 0.85;
    private static final double THRESHOLD_HARD = 0.30;
    private static final int    MIN_ATTEMPTS   = 5; // cần ít nhất 5 lần mới flag

    /**
     * Cập nhật stats sau khi submit/grade.
     * Chạy async — không block response trả về user.
     */
    @Async
    @Transactional
    public void updateStats(List<AttemptAnswer> answers) {
        if (answers == null || answers.isEmpty()) return;
        try {
            for (AttemptAnswer aa : answers) {
                // Chỉ update cho trắc nghiệm/đúng-sai (có isCorrect)
                if (aa.getIsCorrect() == null) continue;
                Question q = aa.getQuestion();
                if (q == null) continue;

                QuestionStat stat = statRepo.findByQuestionId(q.getId())
                        .orElseGet(() -> {
                            QuestionStat s = new QuestionStat();
                            s.setQuestion(q);
                            s.setQuestionId(q.getId());
                            return s;
                        });

                stat.setTotalAttempts(stat.getTotalAttempts() + 1);
                if (Boolean.TRUE.equals(aa.getIsCorrect())) {
                    stat.setCorrectCount(stat.getCorrectCount() + 1);
                }

                double rate = stat.getTotalAttempts() == 0 ? 0.0
                        : (double) stat.getCorrectCount() / stat.getTotalAttempts();
                stat.setCorrectRate(Math.round(rate * 1000.0) / 1000.0);

                // Flag chỉ khi đủ dữ liệu
                if (stat.getTotalAttempts() >= MIN_ATTEMPTS) {
                    if (rate >= THRESHOLD_EASY)      stat.setDifficultyFlag("TOO_EASY");
                    else if (rate <= THRESHOLD_HARD) stat.setDifficultyFlag("TOO_HARD");
                    else                             stat.setDifficultyFlag("OK");
                }

                statRepo.save(stat);
            }
        } catch (Exception e) {
            log.warn("[QuestionStat] updateStats error: {}", e.getMessage());
        }
    }

    // ── Query methods ─────────────────────────────────────

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

    // ── Helper ────────────────────────────────────────────

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