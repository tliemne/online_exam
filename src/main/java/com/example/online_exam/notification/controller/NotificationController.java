package com.example.online_exam.notification.controller;

import com.example.online_exam.common.dto.BaseResponse;
import com.example.online_exam.notification.dto.NotificationResponse;
import com.example.online_exam.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notifService;

    /** Lấy danh sách thông báo của user hiện tại (kèm unreadCount) */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public BaseResponse<NotificationResponse.Page> getMyNotifications(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ok(notifService.getMyNotifications(page, size));
    }

    /** Số thông báo chưa đọc — dùng để hiện badge */
    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public BaseResponse<Long> getUnreadCount() {
        return ok(notifService.getUnreadCount());
    }

    /** Đánh dấu 1 thông báo đã đọc */
    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public BaseResponse<Void> markRead(@PathVariable Long id) {
        notifService.markRead(id);
        return BaseResponse.<Void>builder()
                .status(200).message("ok").timestamp(LocalDateTime.now()).build();
    }

    /** Đánh dấu tất cả đã đọc */
    @PatchMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public BaseResponse<Void> markAllRead() {
        notifService.markAllRead();
        return ok();
    }

    /** Xóa 1 thông báo */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public BaseResponse<Void> deleteOne(@PathVariable Long id) {
        notifService.deleteOne(id);
        return ok();
    }

    /** Xóa tất cả thông báo của user */
    @DeleteMapping
    @PreAuthorize("isAuthenticated()")
    public BaseResponse<Void> deleteAll() {
        notifService.deleteAll();
        return ok();
    }

    private BaseResponse<Void> ok() {
        return BaseResponse.<Void>builder()
                .status(200).message("ok").timestamp(LocalDateTime.now()).build();
    }

    private <T> BaseResponse<T> ok(T data) {
        return BaseResponse.<T>builder()
                .status(200).message("success")
                .data(data).timestamp(LocalDateTime.now()).build();
    }
}