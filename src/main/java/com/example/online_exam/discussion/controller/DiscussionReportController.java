package com.example.online_exam.discussion.controller;

import com.example.online_exam.common.dto.BaseResponse;
import com.example.online_exam.discussion.dto.ReportRequest;
import com.example.online_exam.discussion.dto.ReportResponse;
import com.example.online_exam.discussion.service.DiscussionReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/discussions")
@RequiredArgsConstructor
public class DiscussionReportController {

    private final DiscussionReportService reportService;

    @PostMapping("/{postId}/report")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public BaseResponse<ReportResponse> reportPost(@PathVariable Long postId, @Valid @RequestBody ReportRequest request) {
        return BaseResponse.<ReportResponse>builder()
                .status(200)
                .message("Post reported successfully")
                .data(reportService.reportPost(postId, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping("/replies/{replyId}/report")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public BaseResponse<ReportResponse> reportReply(@PathVariable Long replyId, @Valid @RequestBody ReportRequest request) {
        return BaseResponse.<ReportResponse>builder()
                .status(200)
                .message("Reply reported successfully")
                .data(reportService.reportReply(replyId, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/reports/my")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public BaseResponse<Page<ReportResponse>> getMyReports(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return BaseResponse.<Page<ReportResponse>>builder()
                .status(200)
                .message("Reports retrieved successfully")
                .data(reportService.getMyReports(pageable))
                .timestamp(LocalDateTime.now())
                .build();
    }
}
