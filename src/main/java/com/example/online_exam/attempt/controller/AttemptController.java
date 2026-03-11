package com.example.online_exam.attempt.controller;

import com.example.online_exam.attempt.dto.*;
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

    private final AttemptService  attemptService;
    private final ExportService    exportService;
    private final AiGradingService aiGradingService;

    // POST /attempts/exams/{examId}/submit
    @PostMapping("/exams/{examId}/submit")
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

    // GET /attempts/{id}/ai-suggest  — AI gợi ý chấm tự luận
    @GetMapping("/{id}/ai-suggest")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<List<AiSuggestionResponse>> aiSuggest(@PathVariable Long id) {
        return ok(aiGradingService.suggestGrades(id));
    }

    private <T> BaseResponse<T> ok(T data) {
        return BaseResponse.<T>builder()
                .status(200).message("success")
                .data(data).timestamp(LocalDateTime.now()).build();
    }
}