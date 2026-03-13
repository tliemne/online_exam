package com.example.online_exam.activitylog.controller;

import com.example.online_exam.activitylog.dto.ActivityLogResponse;
import com.example.online_exam.activitylog.service.ActivityLogService;
import com.example.online_exam.common.dto.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/admin/logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ActivityLogController {

    private final ActivityLogService service;

    @GetMapping
    public BaseResponse<Page<ActivityLogResponse>> search(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        return BaseResponse.<Page<ActivityLogResponse>>builder()
                .status(200).message("Success")
                .data(service.search(action, userId, keyword, from, to, page, size))
                .timestamp(LocalDateTime.now())
                .build();
    }
}