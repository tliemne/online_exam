package com.example.online_exam.attempt.service;

import com.example.online_exam.attempt.entity.Attempt;
import com.example.online_exam.attempt.repository.AttemptRepository;
import com.example.online_exam.course.entity.Course;
import com.example.online_exam.course.repository.CourseRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AiClassAnalysisService {

    private final AttemptRepository   attemptRepo;
    private final CourseRepository    courseRepo;
    private final RestTemplate        restTemplate;
    private final ObjectMapper        objectMapper;
    private final StringRedisTemplate redis;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:}")
    private String geminiModel;

    private String geminiUrl() {
        return "https://generativelanguage.googleapis.com/v1beta/models/"
                + geminiModel + ":generateContent";
    }

    private static final Duration CACHE_TTL    = Duration.ofHours(1);
    private static final String   CACHE_PREFIX = "ai:class:";

    public record TopicStat(String topic, int total, int correct, int correctPct) {}

    public record WeakQuestion(
            Long   questionId,
            String content,
            int    totalAnswers,
            int    correctAnswers,
            int    correctPct,
            String flag   // TOO_HARD | TOO_EASY | SUSPICIOUS
    ) {}

    public record ClassAnalysis(
            int                totalStudents,
            int                totalAttempts,
            double             avgScore,
            int                passRate,
            List<TopicStat>    topicStats,
            List<WeakQuestion> weakQuestions,
            String             aiAdvice,
            List<String>       suggestions
    ) {}

    public ClassAnalysis analyze(Long courseId) {
        String cacheKey = CACHE_PREFIX + courseId;
        try {
            String cached = redis.opsForValue().get(cacheKey);
            if (cached != null)
                return objectMapper.readValue(cached, ClassAnalysis.class);
        } catch (Exception ignored) {}

        Course course = courseRepo.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        List<Attempt> attempts = attemptRepo.findGradedWithAnswersByCourse(courseId);

        if (attempts.isEmpty())
            return new ClassAnalysis(
                    course.getStudents() != null ? course.getStudents().size() : 0,
                    0, 0.0, 0, List.of(), List.of(),
                    "Chưa có đủ dữ liệu để phân tích.", List.of());

        // ── Basic stats ───────────────────────────────────
        int totalStudents = course.getStudents() != null ? course.getStudents().size() : 0;
        double avgScore = attempts.stream()
                .filter(a -> a.getScore() != null && a.getTotalScore() != null && a.getTotalScore() > 0)
                .mapToDouble(a -> a.getScore() / a.getTotalScore() * 100)
                .average().orElse(0);
        long passed = attempts.stream().filter(a -> Boolean.TRUE.equals(a.getPassed())).count();
        int passRate = (int) Math.round((double) passed / attempts.size() * 100);

        // ── Tag stats ─────────────────────────────────────
        Map<String, int[]> tagStats = new LinkedHashMap<>();
        Map<Long, int[]>   qStats   = new LinkedHashMap<>();
        Map<Long, String>  qContent = new HashMap<>();

        for (Attempt a : attempts) {
            for (var aa : a.getAnswers()) {
                if (aa.getQuestion() == null) continue;
                boolean correct = Boolean.TRUE.equals(aa.getIsCorrect());
                Long qid = aa.getQuestion().getId();

                qStats.computeIfAbsent(qid, k -> new int[]{0, 0});
                qStats.get(qid)[0]++;
                if (correct) qStats.get(qid)[1]++;
                qContent.putIfAbsent(qid, aa.getQuestion().getContent());

                for (var tag : aa.getQuestion().getTags()) {
                    tagStats.computeIfAbsent(tag.getName(), k -> new int[]{0, 0});
                    tagStats.get(tag.getName())[0]++;
                    if (correct) tagStats.get(tag.getName())[1]++;
                }
            }
        }

        List<TopicStat> topicStats = tagStats.entrySet().stream()
                .filter(e -> e.getValue()[0] >= 5)
                .map(e -> {
                    int t = e.getValue()[0], c = e.getValue()[1];
                    return new TopicStat(e.getKey(), t, c,
                            (int) Math.round((double) c / t * 100));
                })
                .sorted(Comparator.comparingInt(TopicStat::correctPct))
                .limit(10).toList();

        // ── Weak questions ────────────────────────────────
        List<WeakQuestion> weakQuestions = qStats.entrySet().stream()
                .filter(e -> e.getValue()[0] >= 3)
                .map(e -> {
                    int t = e.getValue()[0], c = e.getValue()[1];
                    int pct = (int) Math.round((double) c / t * 100);
                    String flag = pct <= 15 ? "TOO_HARD"
                            : pct >= 95 ? "TOO_EASY"
                            : pct <= 25 ? "SUSPICIOUS" : null;
                    return flag != null
                            ? new WeakQuestion(e.getKey(),
                            qContent.getOrDefault(e.getKey(), ""), t, c, pct, flag)
                            : null;
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(WeakQuestion::correctPct))
                .limit(8).toList();

        // ── AI advice ─────────────────────────────────────
        String aiAdvice = "";
        if (geminiApiKey != null && !geminiApiKey.isBlank() && !topicStats.isEmpty())
            aiAdvice = callAi(course.getName(), topicStats, passRate, (int) Math.round(avgScore));

        // Auto suggestions
        List<String> suggestions = new ArrayList<>();
        topicStats.stream().filter(t -> t.correctPct() < 50)
                .forEach(t -> suggestions.add("Ôn lại " + t.topic() + " (" + t.correctPct() + "% đúng)"));
        if (passRate < 60) suggestions.add("Tỉ lệ đạt thấp — xem xét điều chỉnh độ khó");
        if (!weakQuestions.isEmpty())
            suggestions.add(weakQuestions.size() + " câu hỏi cần xem lại chất lượng");

        ClassAnalysis result = new ClassAnalysis(
                totalStudents, attempts.size(),
                Math.round(avgScore * 10.0) / 10.0,
                passRate, topicStats, weakQuestions, aiAdvice, suggestions);

        try {
            redis.opsForValue().set(cacheKey,
                    objectMapper.writeValueAsString(result), CACHE_TTL);
        } catch (Exception ignored) {}

        return result;
    }

    private String callAi(String courseName, List<TopicStat> topics, int passRate, int avgPct) {
        try {
            StringBuilder sb = new StringBuilder();
            sb.append("Lớp: ").append(courseName)
                    .append(" | Điểm TB: ").append(avgPct)
                    .append("% | Tỉ lệ đạt: ").append(passRate).append("%\n");
            sb.append("Chủ đề:\n");
            topics.forEach(t -> sb.append(String.format("- %s: %d%% đúng\n",
                    t.topic(), t.correctPct())));
            sb.append("\nViết 2 câu nhận xét + 1 gợi ý cải thiện cho giáo viên. Tiếng Việt, ngắn gọn. Chỉ text.");

            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            Map<String, Object> body = Map.of("contents",
                    List.of(Map.of("parts", List.of(Map.of("text", sb.toString())))));
            ResponseEntity<String> resp = restTemplate.postForEntity(
                    geminiUrl() + "?key=" + geminiApiKey,
                    new HttpEntity<>(body, h), String.class);
            return objectMapper.readTree(resp.getBody())
                    .path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText("");
        } catch (Exception e) {
            log.warn("[AiClass] advice failed: {}", e.getMessage());
            return "";
        }
    }
}