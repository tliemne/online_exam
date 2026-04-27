package com.example.online_exam.discussion.controller;

import com.example.online_exam.common.dto.BaseResponse;
import com.example.online_exam.discussion.dto.DiscussionPostResponse;
import com.example.online_exam.discussion.service.AdminDiscussionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Admin Discussion Management Controller
 * Provides system-wide discussion moderation capabilities for admins
 */
@RestController
@RequestMapping("/api/admin/discussions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDiscussionController {

    private final AdminDiscussionService adminDiscussionService;

    /**
     * Get all discussions across all courses with filters
     * 
     * @param courseId Optional filter by course
     * @param status Optional filter by status (ACTIVE, CLOSED)
     * @param query Optional search query for title/content
     * @param page Page number (0-indexed)
     * @param size Page size
     * @return Paginated list of discussions
     */
    @GetMapping
    public BaseResponse<Page<DiscussionPostResponse>> getAllDiscussions(
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<DiscussionPostResponse> discussions = adminDiscussionService.getAllDiscussions(
                courseId, status, query, page, size
        );
        
        return BaseResponse.<Page<DiscussionPostResponse>>builder()
                .status(200)
                .message("Success")
                .data(discussions)
                .build();
    }
}
