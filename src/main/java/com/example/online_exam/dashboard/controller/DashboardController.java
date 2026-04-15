package com.example.online_exam.dashboard.controller;

import com.example.online_exam.common.dto.BaseResponse;
import com.example.online_exam.dashboard.dto.DashboardResponse;
import com.example.online_exam.dashboard.service.DashboardService;
import com.example.online_exam.discussion.dto.AdminDiscussionStatsDTO;
import com.example.online_exam.discussion.dto.StudentDiscussionStatsDTO;
import com.example.online_exam.discussion.dto.TeacherDiscussionStatsDTO;
import com.example.online_exam.discussion.service.DiscussionStatsService;
import com.example.online_exam.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final DiscussionStatsService discussionStatsService;

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

    // Discussion stats endpoints
    @GetMapping("/discussion/teacher")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<TeacherDiscussionStatsDTO> teacherDiscussionStats(@AuthenticationPrincipal User user) {
        return ok(discussionStatsService.getTeacherStats(user.getId()));
    }

    @GetMapping("/discussion/student")
    @PreAuthorize("hasRole('STUDENT')")
    public BaseResponse<StudentDiscussionStatsDTO> studentDiscussionStats(@AuthenticationPrincipal User user) {
        return ok(discussionStatsService.getStudentStats(user.getId()));
    }

    @GetMapping("/discussion/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public BaseResponse<AdminDiscussionStatsDTO> adminDiscussionStats() {
        return ok(discussionStatsService.getAdminStats());
    }

    private <T> BaseResponse<T> ok(T data) {
        return BaseResponse.<T>builder()
                .status(200).message("success")
                .data(data).timestamp(LocalDateTime.now()).build();
    }
}