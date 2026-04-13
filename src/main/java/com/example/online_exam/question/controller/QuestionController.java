package com.example.online_exam.question.controller;

import com.example.online_exam.common.dto.BaseResponse;
import com.example.online_exam.question.dto.QuestionRequest;
import com.example.online_exam.question.dto.QuestionResponse;
import com.example.online_exam.question.enums.Difficulty;
import com.example.online_exam.question.enums.QuestionType;
import com.example.online_exam.question.service.AiQuestionService;
import com.example.online_exam.question.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService   questionService;
    private final AiQuestionService aiQuestionService;

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

    // GET /questions?courseId=1&type=MC&difficulty=EASY&keyword=java&page=0&size=20
    // Nếu có param 'paged=true' → trả Page, không thì trả List (cho AddQuestionsModal)
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public BaseResponse<?> search(
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) QuestionType type,
            @RequestParam(required = false) Difficulty difficulty,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long tagId,
            @RequestParam(defaultValue = "false") boolean paged,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        if (paged) {
            // Phân trang — dùng cho QuestionsPage
            PageRequest pageable = PageRequest.of(page, size, Sort.by("id").descending());
            Page<QuestionResponse> result = tagId != null
                    ? questionService.searchPagedWithTag(courseId, type, difficulty, keyword, tagId, pageable)
                    : questionService.searchPaged(courseId, type, difficulty, keyword, pageable);
            return BaseResponse.<Page<QuestionResponse>>builder()
                    .status(200).message("success").data(result).timestamp(LocalDateTime.now()).build();
        } else {
            // Lấy toàn bộ — dùng cho AddQuestionsModal trong Exam
            List<QuestionResponse> result = tagId != null
                    ? questionService.searchWithTag(courseId, type, difficulty, keyword, tagId)
                    : questionService.search(courseId, type, difficulty, keyword);
            return BaseResponse.<List<QuestionResponse>>builder()
                    .status(200).message("success").data(result).timestamp(LocalDateTime.now()).build();
        }
    }

    /** AI preview: tạo câu hỏi theo chủ đề, chưa lưu DB */
    @PostMapping("/ai-generate")
    @PreAuthorize("isAuthenticated()")
    public BaseResponse<List<AiQuestionService.GeneratedQuestion>> aiGenerate(
            @RequestBody AiQuestionService.GenerateRequest req) {
        return BaseResponse.<List<AiQuestionService.GeneratedQuestion>>builder()
                .status(200).message("success")
                .data(aiQuestionService.generate(req))
                .timestamp(LocalDateTime.now()).build();
    }

    /** Lưu 1 câu hỏi do AI tạo vào DB */
    @PostMapping("/ai-save")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<QuestionResponse> aiSave(
            @RequestBody AiQuestionService.GeneratedQuestion gq,
            @RequestParam Long courseId,
            @RequestParam(required = false) String tags) {
        QuestionRequest req = aiQuestionService.toQuestionRequest(gq, courseId, tags);
        return BaseResponse.<QuestionResponse>builder()
                .status(200).message("Đã lưu câu hỏi")
                .data(questionService.create(req))
                .timestamp(LocalDateTime.now()).build();
    }

    /** DEBUG: Xóa toàn bộ cache (chỉ admin) */
    @PostMapping("/cache/clear")
    @PreAuthorize("hasRole('ADMIN')")
    public BaseResponse<String> clearCache() {
        questionService.clearCache();
        return BaseResponse.<String>builder()
                .status(200).message("Đã xóa cache")
                .data("Cache cleared successfully")
                .timestamp(LocalDateTime.now()).build();
    }
}