package com.example.online_exam.exam.controller;

import com.example.online_exam.common.dto.BaseResponse;
import com.example.online_exam.exam.dto.*;
import com.example.online_exam.exam.service.ExamService;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;
    private final UserRepository userRepo;
    private final CurrentUserService currentUserService;

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

    // ── Helper ────────────────────────────────────────────
    private <T> BaseResponse<T> ok(T data) {
        return BaseResponse.<T>builder()
                .status(200).message("success")
                .data(data).timestamp(LocalDateTime.now()).build();
    }
}