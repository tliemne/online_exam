package com.example.online_exam.attempt.controller;

import com.example.online_exam.attempt.dto.*;
import com.example.online_exam.attempt.service.AiClassAnalysisService;
import com.example.online_exam.attempt.service.AiGradingService;
import com.example.online_exam.attempt.service.ExportService;
import com.example.online_exam.attempt.service.AttemptService;
import com.example.online_exam.common.dto.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/attempts")
@RequiredArgsConstructor
public class AttemptController {

    private final AttemptService         attemptService;
    private final ExportService          exportService;
    private final AiGradingService       aiGradingService;
    private final AiClassAnalysisService aiClassAnalysisService;

    // POST /attempts/exams/{examId}/start — tạo attempt IN_PROGRESS (hoặc trả lại nếu đã có)
    @PostMapping("/exams/{examId}/start")
    @PreAuthorize("hasRole('STUDENT')")
    public BaseResponse<AttemptResponse> startExam(@PathVariable Long examId) {
        return ok(attemptService.startExam(examId));
    }

    // POST /attempts/{attemptId}/submit — nộp bài từ attemptId
    @PostMapping("/{attemptId}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public BaseResponse<AttemptResponse> submitAttempt(
            @PathVariable Long attemptId,
            @RequestBody List<SubmitAnswerItem> items) {
        return ok(attemptService.submitAttempt(attemptId, items));
    }

    // POST /attempts/exams/{examId}/submit
    @PreAuthorize("hasRole('STUDENT')")
    public BaseResponse<AttemptResponse> submit(
            @PathVariable Long examId,
            @RequestBody List<SubmitAnswerItem> answers) {
        return ok(attemptService.submit(examId, answers));
    }

    // GET /attempts/{id}
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public BaseResponse<AttemptResponse> getById(@PathVariable Long id) {
        return ok(attemptService.getById(id));
    }

    // GET /attempts/my  — student xem lịch sử của mình
    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public BaseResponse<List<AttemptResponse>> getMyAttempts() {
        return ok(attemptService.getMyAttempts());
    }

    // GET /attempts/my/exams/{examId}  — student xem lịch sử 1 đề
    @GetMapping("/my/exams/{examId}")
    @PreAuthorize("hasRole('STUDENT')")
    public BaseResponse<List<AttemptResponse>> getMyAttemptsByExam(@PathVariable Long examId) {
        return ok(attemptService.getMyAttemptsByExam(examId));
    }

    // GET /attempts/exams/{examId}  — teacher xem tất cả bài nộp
    @GetMapping("/exams/{examId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<List<AttemptResponse>> getByExam(@PathVariable Long examId) {
        return ok(attemptService.getByExam(examId));
    }

    // PUT /attempts/{id}/grade  — teacher chấm điểm
    @PutMapping("/{id}/grade")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<AttemptResponse> grade(
            @PathVariable Long id,
            @RequestBody GradeRequest req) {
        return ok(attemptService.grade(id, req));
    }

    // GET /attempts/my/exam/{examId}/inprogress — lấy attempt đang dở để resume
    @GetMapping("/my/exam/{examId}/inprogress")
    @PreAuthorize("hasRole('STUDENT')")
    public BaseResponse<AttemptResponse> getMyInProgress(@PathVariable Long examId) {
        return BaseResponse.<AttemptResponse>builder()
                .status(200).message("OK").data(attemptService.getMyInProgress(examId))
                .timestamp(java.time.LocalDateTime.now()).build();
    }

    // PATCH + POST /attempts/{id}/heartbeat — PATCH từ JS fetch, POST từ sendBeacon
    @PatchMapping("/{id}/heartbeat")
    @PostMapping("/{id}/heartbeat")
    @PreAuthorize("hasRole('STUDENT')")
    public BaseResponse<Void> heartbeat(
            @PathVariable Long id,
            @RequestBody HeartbeatRequest req) {
        attemptService.heartbeat(id, req.getTimeRemainingSeconds(), req.getTabViolationCount(), req.getAnswers());
        return ok(null);
    }

    // DELETE /attempts/{id}/reset  — teacher/admin reset bài thi của student
    @DeleteMapping("/{id}/reset")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<Void> resetAttempt(@PathVariable Long id) {
        attemptService.resetAttempt(id);
        return BaseResponse.<Void>builder()
                .status(200).message("Đã reset bài thi thành công")
                .timestamp(java.time.LocalDateTime.now()).build();
    }

    // GET /attempts/exams/{examId}/export  — teacher xuất Excel
    // GET /attempts/grading/pending/{examId} — số bài chờ chấm (tránh static resource conflict)
    @GetMapping("/grading/pending/{examId}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public BaseResponse<Long> getPendingCount(@PathVariable Long examId) {
        return ok(attemptService.countPendingByExam(examId));
    }

    @GetMapping("/exams/{examId}/export")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<byte[]> exportExamResults(@PathVariable Long examId) {
        byte[] data = exportService.exportExamResults(examId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment",
                "ket-qua-thi-" + examId + ".xlsx");
        return ResponseEntity.ok().headers(headers).body(data);
    }

    // GET /attempts/courses/{courseId}/leaderboard/export — xuất BXH lớp
    @GetMapping("/courses/{courseId}/leaderboard/export")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<byte[]> exportCourseLeaderboard(@PathVariable Long courseId) {
        byte[] data = exportService.exportCourseLeaderboard(courseId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment",
                "bxh-lop-" + courseId + ".xlsx");
        return ResponseEntity.ok().headers(headers).body(data);
    }

    // GET /attempts/courses/{courseId}/report/export — xuất báo cáo tổng hợp lớp
    @GetMapping("/courses/{courseId}/report/export")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<byte[]> exportCourseReport(@PathVariable Long courseId) {
        byte[] data = exportService.exportCourseReport(courseId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment",
                "bao-cao-lop-" + courseId + ".xlsx");
        return ResponseEntity.ok().headers(headers).body(data);
    }

    // GET /attempts/{id}/ai-suggest  — AI gợi ý chấm tự luận
    @GetMapping("/{id}/ai-suggest")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<List<AiSuggestionResponse>> aiSuggest(@PathVariable Long id) {
        return ok(aiGradingService.suggestGrades(id));
    }

    // GET /attempts/{id}/ai-explain  — AI giải thích câu sai (student dùng sau khi nộp)
    @GetMapping("/{id}/ai-explain")
    @PreAuthorize("isAuthenticated()")
    public BaseResponse<AiExplanationResponse.Summary> aiExplain(@PathVariable Long id) {
        return ok(aiGradingService.explainWrongAnswers(id));
    }

    // GET /attempts/ai-weakness  — AI phân tích điểm yếu student
    @GetMapping("/ai-weakness")
    @PreAuthorize("hasRole('STUDENT')")
    public BaseResponse<AiGradingService.WeaknessAnalysis> aiWeakness(
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            com.example.online_exam.user.entity.User currentUser) {
        return ok(aiGradingService.analyzeWeakness(currentUser.getId()));
    }

    // DELETE /attempts/ai-weakness/cache  — Xóa cache để phân tích lại
    @DeleteMapping("/ai-weakness/cache")
    @PreAuthorize("hasRole('STUDENT')")
    public BaseResponse<String> clearWeaknessCache(
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            com.example.online_exam.user.entity.User currentUser) {
        aiGradingService.clearWeaknessCache(currentUser.getId());
        return ok("Cache đã được xóa");
    }

    // GET /attempts/ai-class/{courseId}  — AI phân tích lớp học (Teacher)
    @GetMapping("/ai-class/{courseId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<AiClassAnalysisService.ClassAnalysis> aiClass(
            @PathVariable Long courseId) {
        return ok(aiClassAnalysisService.analyze(courseId));
    }

    private <T> BaseResponse<T> ok(T data) {
        return BaseResponse.<T>builder()
                .status(200).message("success")
                .data(data).timestamp(LocalDateTime.now()).build();
    }
}