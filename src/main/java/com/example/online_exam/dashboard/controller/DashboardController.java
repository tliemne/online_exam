package com.example.online_exam.dashboard.controller;

import com.example.online_exam.common.dto.BaseResponse;
import com.example.online_exam.dashboard.dto.DashboardResponse;
import com.example.online_exam.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public BaseResponse<DashboardResponse.Admin> adminStats() {
        return ok(dashboardService.adminStats());
    }

    @GetMapping("/teacher")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<DashboardResponse.Teacher> teacherStats() {
        return ok(dashboardService.teacherStats());
    }

    @GetMapping("/student")
    @PreAuthorize("hasRole('STUDENT')")
    public BaseResponse<DashboardResponse.Student> studentStats() {
        return ok(dashboardService.studentStats());
    }

    private <T> BaseResponse<T> ok(T data) {
        return BaseResponse.<T>builder()
                .status(200).message("success")
                .data(data).timestamp(LocalDateTime.now()).build();
    }
}