package com.example.online_exam.attempt.controller;

import com.example.online_exam.attempt.dto.CourseLeaderboardResponse;
import com.example.online_exam.attempt.service.CourseLeaderboardService;
import com.example.online_exam.common.dto.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/courses/{courseId}/leaderboard")
@RequiredArgsConstructor
public class CourseLeaderboardController {

    private final CourseLeaderboardService leaderboardService;

    /**
     * GET /courses/{courseId}/leaderboard
     * Teacher/Admin xem đầy đủ, Student xem trong lớp mình đang học.
     * Authorization chi tiết do service kiểm soát qua CurrentUserService.
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public BaseResponse<?> getLeaderboard(
            @PathVariable Long courseId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (page != null && size != null) {
            // Paginated request
            return BaseResponse.builder()
                    .status(200)
                    .message("success")
                    .data(leaderboardService.getLeaderboardPaginated(courseId, page, size))
                    .timestamp(LocalDateTime.now())
                    .build();
        }
        // Non-paginated request (backward compatibility)
        return BaseResponse.<CourseLeaderboardResponse>builder()
                .status(200)
                .message("success")
                .data(leaderboardService.getLeaderboard(courseId))
                .timestamp(LocalDateTime.now())
                .build();
    }
}