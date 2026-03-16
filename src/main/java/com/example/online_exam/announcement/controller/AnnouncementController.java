package com.example.online_exam.announcement.controller;

import com.example.online_exam.announcement.dto.AnnouncementDto;
import com.example.online_exam.announcement.service.AnnouncementService;
import com.example.online_exam.common.dto.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/courses/{courseId}/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService service;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public BaseResponse<List<AnnouncementDto.Response>> getAll(@PathVariable Long courseId) {
        return ok(service.getByCourse(courseId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<AnnouncementDto.Response> create(
            @PathVariable Long courseId,
            @RequestBody AnnouncementDto.Request req) {
        return ok(service.create(courseId, req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<AnnouncementDto.Response> update(
            @PathVariable Long courseId,
            @PathVariable Long id,
            @RequestBody AnnouncementDto.Request req) {
        return ok(service.update(courseId, id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<Void> delete(
            @PathVariable Long courseId,
            @PathVariable Long id) {
        service.delete(courseId, id);
        return BaseResponse.<Void>builder()
                .status(200).message("Đã xóa thông báo")
                .timestamp(LocalDateTime.now()).build();
    }

    private <T> BaseResponse<T> ok(T data) {
        return BaseResponse.<T>builder()
                .status(200).message("success")
                .data(data).timestamp(LocalDateTime.now()).build();
    }
}