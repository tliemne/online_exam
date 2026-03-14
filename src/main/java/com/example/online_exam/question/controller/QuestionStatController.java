package com.example.online_exam.question.controller;

import com.example.online_exam.common.dto.BaseResponse;
import com.example.online_exam.question.dto.QuestionStatResponse;
import com.example.online_exam.question.service.QuestionStatService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/questions/stats")
@RequiredArgsConstructor
public class QuestionStatController {

    private final QuestionStatService statService;

    /** Toàn bộ stats của 1 course — teacher/admin xem */
    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<List<QuestionStatResponse>> getByCourse(@PathVariable Long courseId) {
        return BaseResponse.<List<QuestionStatResponse>>builder()
                .status(200).message("success")
                .data(statService.getByCourse(courseId))
                .timestamp(LocalDateTime.now()).build();
    }

    /** Chỉ lấy câu hỏi bị flag TOO_EASY / TOO_HARD */
    @GetMapping("/course/{courseId}/flagged")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<List<QuestionStatResponse>> getFlagged(@PathVariable Long courseId) {
        return BaseResponse.<List<QuestionStatResponse>>builder()
                .status(200).message("success")
                .data(statService.getFlaggedByCourse(courseId))
                .timestamp(LocalDateTime.now()).build();
    }
}