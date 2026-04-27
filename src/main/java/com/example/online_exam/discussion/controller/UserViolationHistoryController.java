package com.example.online_exam.discussion.controller;

import com.example.online_exam.common.dto.BaseResponse;
import com.example.online_exam.discussion.dto.UserViolationHistoryDTO;
import com.example.online_exam.discussion.service.UserViolationHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/violations/history")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class UserViolationHistoryController {

    private final UserViolationHistoryService violationHistoryService;

    /**
     * Lấy lịch sử vi phạm của user hiện tại
     */
    @GetMapping("/my-violations")
    public BaseResponse<Page<UserViolationHistoryDTO>> getMyViolationHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<UserViolationHistoryDTO> data = violationHistoryService.getMyViolationHistory(pageable);
        return BaseResponse.<Page<UserViolationHistoryDTO>>builder()
                .status(200)
                .message("Lịch sử vi phạm của bạn")
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Lấy lịch sử vi phạm của user cụ thể (admin hoặc chính user đó)
     */
    @GetMapping("/user/{userId}")
    public BaseResponse<Page<UserViolationHistoryDTO>> getUserViolationHistory(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<UserViolationHistoryDTO> data = violationHistoryService.getUserViolationHistory(userId, pageable);
        return BaseResponse.<Page<UserViolationHistoryDTO>>builder()
                .status(200)
                .message("Lịch sử vi phạm của user")
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
