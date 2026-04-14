package com.example.online_exam.exam.controller;

import com.example.online_exam.common.dto.BaseResponse;
import com.example.online_exam.exam.dto.*;
import com.example.online_exam.exam.service.ExamService;
import com.example.online_exam.question.service.AiQuestionService;
import com.example.online_exam.question.service.QuestionService;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService        examService;
    private final UserRepository     userRepo;
    private final CurrentUserService currentUserService;
    private final AiQuestionService  aiQuestionService;
    private final QuestionService    questionService;

    // ── CRUD ──────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<ExamResponse> create(@Validated @RequestBody ExamRequest req) {
        return ok(examService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<ExamResponse> update(@PathVariable Long id, @RequestBody ExamRequest req) {
        return ok(examService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<Void> delete(@PathVariable Long id) {
        examService.delete(id);
        return BaseResponse.<Void>builder()
                .status(200).message("Deleted").timestamp(LocalDateTime.now()).build();
    }

    // GET /exams/{id}?includeQuestions=true&hideCorrect=false
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public BaseResponse<ExamResponse> getById(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean includeQuestions,
            @RequestParam(defaultValue = "false") boolean hideCorrect) {
        return ok(examService.getById(id, includeQuestions, hideCorrect));
    }

    // GET /exams?courseId=1  — nếu có courseId thì filter theo lớp, không thì lấy tất cả
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<List<ExamResponse>> getAll(@RequestParam(required = false) Long courseId) {
        if (courseId != null) return ok(examService.getByCourse(courseId));
        return ok(examService.getAll());
    }

    // GET /exams/student  — student xem đề PUBLISHED của các lớp mình
    @GetMapping("/student")
    @PreAuthorize("hasRole('STUDENT')")
    public BaseResponse<List<ExamResponse>> getForStudent() {
        User student = currentUserService.requireCurrentUser();
        return ok(examService.getForStudent(student.getId()));
    }

    // ── Publish / Close ───────────────────────────────────

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<ExamResponse> publish(@PathVariable Long id) {
        return ok(examService.publish(id));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<ExamResponse> close(@PathVariable Long id) {
        return ok(examService.close(id));
    }

    // ── Question management ───────────────────────────────

    // POST /exams/{id}/questions   — thêm nhiều câu
    @PostMapping("/{id}/questions")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<ExamResponse> addQuestions(
            @PathVariable Long id,
            @RequestBody List<ExamQuestionItem> items) {
        return ok(examService.addQuestions(id, items));
    }

    // DELETE /exams/{id}/questions/{questionId}   — xóa 1 câu khỏi đề
    @DeleteMapping("/{id}/questions/{questionId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<ExamResponse> removeQuestion(
            @PathVariable Long id,
            @PathVariable Long questionId) {
        return ok(examService.removeQuestion(id, questionId));
    }

    // PUT /exams/{id}/questions/{questionId}   — update điểm câu hỏi
    @PutMapping("/{id}/questions/{questionId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<ExamResponse> updateQuestionScore(
            @PathVariable Long id,
            @PathVariable Long questionId,
            @RequestBody ExamQuestionItem item) {
        return ok(examService.updateQuestionScore(id, questionId, item.getScore()));
    }

    // PUT /exams/{id}/questions/reorder  — sắp xếp lại thứ tự câu
    @PutMapping("/{id}/questions/reorder")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<ExamResponse> reorder(
            @PathVariable Long id,
            @RequestBody List<ExamQuestionItem> items) {
        return ok(examService.reorderQuestions(id, items));
    }

    @PostMapping("/{id}/random-questions")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<ExamResponse> randomQuestions(
            @PathVariable Long id,
            @RequestBody RandomQuestionRequest request) {
        return ok(examService.randomQuestions(id, request));
    }

    // ── AI tạo đề thi tự động ────────────────────────────
    @Data
    public static class AiExamRequest {
        private String  title;
        private Long    courseId;
        private Integer durationMinutes = 45;
        private Double  totalScore      = 10.0;
        private Double  passScore       = 5.0;
        // Các topic cần tạo câu hỏi
        private List<TopicConfig> topics;

        @Data
        public static class TopicConfig {
            private String topic;
            private String difficulty;  // EASY | MEDIUM | HARD | ALL
            private int    count;
            private String type;        // MULTIPLE_CHOICE | TRUE_FALSE
        }
    }

    @Data
    public static class AiExamResult {
        private ExamResponse exam;
        private int          totalGenerated;
        private int          totalSaved;
        private List<String> errors;
    }

    @PostMapping("/ai-generate")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<AiExamResult> aiGenerateExam(@RequestBody AiExamRequest req) {
        // 1. Tạo exam trước (DRAFT)
        ExamRequest examReq = new ExamRequest();
        examReq.setTitle(req.getTitle() != null && !req.getTitle().isBlank()
                ? req.getTitle() : "Đề thi AI - " + LocalDateTime.now().toLocalDate());
        examReq.setCourseId(req.getCourseId());
        examReq.setDurationMinutes(req.getDurationMinutes());
        examReq.setTotalScore(req.getTotalScore());
        examReq.setPassScore(req.getPassScore());
        ExamResponse exam = examService.create(examReq);

        // 2. Với mỗi topic, gọi AI tạo câu hỏi → lưu DB → gắn vào exam
        List<ExamQuestionItem> items = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int totalGenerated = 0;

        for (AiExamRequest.TopicConfig tc : req.getTopics()) {
            try {
                String diff = tc.getDifficulty() != null ? tc.getDifficulty() : "MEDIUM";
                String type = tc.getType() != null ? tc.getType() : "MULTIPLE_CHOICE";

                List<String> difficulties = diff.equals("ALL")
                        ? List.of("EASY", "MEDIUM", "HARD") : List.of(diff);

                // Chia đều: mức đầu lấy phần dư
                int basePerDiff = tc.getCount() / 3;
                int remainder   = tc.getCount() % 3;

                int diffIdx = 0;
                for (String d : difficulties) {
                    int thisCount = basePerDiff + (diffIdx < remainder ? 1 : 0);
                    diffIdx++;
                    if (thisCount == 0) continue;
                    var genReq = new AiQuestionService.GenerateRequest(
                            tc.getTopic(), type, d, thisCount, req.getCourseId(), tc.getTopic(),
                            Boolean.TRUE); // luôn tạo mới, không cache
                    var generated = aiQuestionService.generate(genReq);
                    totalGenerated += generated.size();

                    for (var gq : generated) {
                        try {
                            var qReq = aiQuestionService.toQuestionRequest(gq, req.getCourseId(), tc.getTopic());
                            var saved = questionService.create(qReq);
                            double score = req.getTotalScore() / Math.max(1, req.getTopics().stream()
                                    .mapToInt(AiExamRequest.TopicConfig::getCount).sum());
                            ExamQuestionItem item = new ExamQuestionItem();
                            item.setQuestionId(saved.getId());
                            item.setScore(Math.round(score * 10.0) / 10.0);
                            item.setOrderIndex(items.size() + 1);
                            items.add(item);
                        } catch (Exception e) {
                            errors.add("Lưu câu hỏi lỗi: " + e.getMessage());
                        }
                    }
                }
            } catch (Exception e) {
                errors.add("Topic '" + tc.getTopic() + "': " + e.getMessage());
            }
        }

        // 3. Gắn tất cả câu hỏi vào exam
        ExamResponse finalExam = exam;
        if (!items.isEmpty()) {
            finalExam = examService.addQuestions(exam.getId(), items);
        }

        AiExamResult result = new AiExamResult();
        result.setExam(finalExam);
        result.setTotalGenerated(totalGenerated);
        result.setTotalSaved(items.size());
        result.setErrors(errors);
        return ok(result);
    }

    // ── Helper ────────────────────────────────────────────
    private <T> BaseResponse<T> ok(T data) {
        return BaseResponse.<T>builder()
                .status(200).message("success")
                .data(data).timestamp(LocalDateTime.now()).build();
    }
}