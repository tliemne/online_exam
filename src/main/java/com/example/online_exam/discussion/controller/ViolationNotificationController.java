package com.example.online_exam.discussion.controller;

import com.example.online_exam.common.dto.BaseResponse;
import com.example.online_exam.discussion.dto.ViolationNotificationDTO;
import com.example.online_exam.discussion.service.ViolationNotificationService;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/violation-notifications")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ViolationNotificationController {

    private final ViolationNotificationService violationNotificationService;
    private final CurrentUserService currentUserService;

    /**
     * Lấy thông báo vi phạm của user hiện tại
     */
    @GetMapping
    public BaseResponse<Page<ViolationNotificationDTO>> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        User currentUser = currentUserService.requireCurrentUser();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ViolationNotificationDTO> data = violationNotificationService.getUserNotifications(
                currentUser.getId(), pageable);
        return BaseResponse.<Page<ViolationNotificationDTO>>builder()
                .status(200)
                .message("Thông báo vi phạm của bạn")
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Lấy số lượng thông báo chưa đọc
     */
    @GetMapping("/unread-count")
    public BaseResponse<Long> getUnreadCount() {
        User currentUser = currentUserService.requireCurrentUser();
        Long count = violationNotificationService.countUnreadNotifications(currentUser.getId());
        return BaseResponse.<Long>builder()
                .status(200)
                .message("Số thông báo chưa đọc")
                .data(count)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Đánh dấu thông báo là đã đọc
     */
    @PostMapping("/{notificationId}/mark-read")
    public BaseResponse<ViolationNotificationDTO> markAsRead(@PathVariable Long notificationId) {
        ViolationNotificationDTO data = violationNotificationService.markAsRead(notificationId);
        return BaseResponse.<ViolationNotificationDTO>builder()
                .status(200)
                .message("Đã đánh dấu thông báo là đã đọc")
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Đánh dấu tất cả thông báo là đã đọc
     */
    @PostMapping("/mark-all-read")
    public BaseResponse<Void> markAllAsRead() {
        User currentUser = currentUserService.requireCurrentUser();
        violationNotificationService.markAllAsRead(currentUser.getId());
        return BaseResponse.<Void>builder()
                .status(200)
                .message("Đã đánh dấu tất cả thông báo là đã đọc")
                .timestamp(LocalDateTime.now())
                .build();
    }
}
