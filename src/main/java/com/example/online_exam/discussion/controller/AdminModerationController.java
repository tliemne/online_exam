package com.example.online_exam.discussion.controller;

import com.example.online_exam.common.dto.BaseResponse;
import com.example.online_exam.discussion.dto.ModerationActionRequest;
import com.example.online_exam.discussion.dto.ReportResponse;
import com.example.online_exam.discussion.dto.UserViolationStatsDTO;
import com.example.online_exam.discussion.service.AdminModerationService;
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
@RequestMapping("/api/admin/moderation")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminModerationController {

    private final AdminModerationService moderationService;

    @GetMapping("/reports/pending")
    public BaseResponse<Page<ReportResponse>> getPendingReports(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return BaseResponse.<Page<ReportResponse>>builder().status(200).message("Pending reports retrieved successfully").data(moderationService.getPendingReports(pageable)).timestamp(LocalDateTime.now()).build();
    }

    @GetMapping("/reports/{reportId}")
    public BaseResponse<ReportResponse> getReportDetails(@PathVariable Long reportId) {
        return BaseResponse.<ReportResponse>builder().status(200).message("Report details retrieved successfully").data(moderationService.getReportDetails(reportId)).timestamp(LocalDateTime.now()).build();
    }

    @PostMapping("/reports/{reportId}/dismiss")
    public BaseResponse<ReportResponse> dismissReport(@PathVariable Long reportId, @Valid @RequestBody ModerationActionRequest request) {
        return BaseResponse.<ReportResponse>builder().status(200).message("Report dismissed successfully").data(moderationService.dismissReport(reportId, request)).timestamp(LocalDateTime.now()).build();
    }

    @PostMapping("/reports/{reportId}/delete-content")
    public BaseResponse<ReportResponse> deleteContent(@PathVariable Long reportId, @Valid @RequestBody ModerationActionRequest request) {
        return BaseResponse.<ReportResponse>builder().status(200).message("Content deleted successfully").data(moderationService.deleteContent(reportId, request)).timestamp(LocalDateTime.now()).build();
    }

    @PostMapping("/reports/{reportId}/warn")
    public BaseResponse<ReportResponse> warnUser(@PathVariable Long reportId, @Valid @RequestBody ModerationActionRequest request) {
        return BaseResponse.<ReportResponse>builder().status(200).message("User warned successfully").data(moderationService.warnUser(reportId, request)).timestamp(LocalDateTime.now()).build();
    }

    @PostMapping("/reports/{reportId}/mute")
    public BaseResponse<ReportResponse> muteUser(@PathVariable Long reportId, @Valid @RequestBody ModerationActionRequest request) {
        return BaseResponse.<ReportResponse>builder().status(200).message("User muted successfully").data(moderationService.muteUser(reportId, request)).timestamp(LocalDateTime.now()).build();
    }

    @PostMapping("/reports/{reportId}/ban")
    public BaseResponse<ReportResponse> banUser(@PathVariable Long reportId, @Valid @RequestBody ModerationActionRequest request) {
        return BaseResponse.<ReportResponse>builder().status(200).message("User banned successfully").data(moderationService.banUser(reportId, request)).timestamp(LocalDateTime.now()).build();
    }

    @GetMapping("/users/{userId}/violations")
    public BaseResponse<UserViolationStatsDTO> getUserViolationStats(@PathVariable Long userId) {
        return BaseResponse.<UserViolationStatsDTO>builder().status(200).message("User violation stats retrieved successfully").data(moderationService.getUserViolationStats(userId)).timestamp(LocalDateTime.now()).build();
    }
}
