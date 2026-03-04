package com.example.online_exam.question.controller;

import com.example.online_exam.common.dto.BaseResponse;
import com.example.online_exam.question.dto.QuestionRequest;
import com.example.online_exam.question.dto.QuestionResponse;
import com.example.online_exam.question.enums.Difficulty;
import com.example.online_exam.question.enums.QuestionType;
import com.example.online_exam.question.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<QuestionResponse> create(@Validated @RequestBody QuestionRequest request) {
        return BaseResponse.<QuestionResponse>builder()
                .status(200).message("create question success")
                .data(questionService.create(request))
                .timestamp(LocalDateTime.now()).build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<QuestionResponse> update(@PathVariable Long id,
                                                 @Validated @RequestBody QuestionRequest request) {
        return BaseResponse.<QuestionResponse>builder()
                .status(200).message("update question success")
                .data(questionService.update(id, request))
                .timestamp(LocalDateTime.now()).build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<Void> delete(@PathVariable Long id) {
        questionService.delete(id);
        return BaseResponse.<Void>builder()
                .status(200).message("delete question success")
                .timestamp(LocalDateTime.now()).build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public BaseResponse<QuestionResponse> getById(@PathVariable Long id) {
        return BaseResponse.<QuestionResponse>builder()
                .status(200).message("success")
                .data(questionService.getById(id))
                .timestamp(LocalDateTime.now()).build();
    }

    // GET /questions?courseId=1&type=MULTIPLE_CHOICE&difficulty=EASY&keyword=java
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public BaseResponse<List<QuestionResponse>> search(
            @RequestParam Long courseId,
            @RequestParam(required = false) QuestionType type,
            @RequestParam(required = false) Difficulty difficulty,
            @RequestParam(required = false) String keyword) {
        return BaseResponse.<List<QuestionResponse>>builder()
                .status(200).message("success")
                .data(questionService.search(courseId, type, difficulty, keyword))
                .timestamp(LocalDateTime.now()).build();
    }
}