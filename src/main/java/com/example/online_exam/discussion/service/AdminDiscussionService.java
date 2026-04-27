package com.example.online_exam.discussion.service;

import com.example.online_exam.discussion.dto.DiscussionPostResponse;
import com.example.online_exam.discussion.entity.DiscussionPost;
import com.example.online_exam.discussion.enums.PostStatus;
import com.example.online_exam.discussion.mapper.DiscussionPostMapper;
import com.example.online_exam.discussion.repository.DiscussionPostRepository;
import com.example.online_exam.discussion.repository.DiscussionVoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Admin Discussion Service
 * Handles system-wide discussion management for admins
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDiscussionService {

    private final DiscussionPostRepository discussionPostRepository;
    private final DiscussionVoteRepository discussionVoteRepository;
    private final DiscussionPostMapper discussionPostMapper;

    /**
     * Get all discussions across all courses with optional filters
     * Admin can see discussions from any course for moderation purposes
     * 
     * @param courseId Optional filter by specific course
     * @param statusStr Optional filter by status (ACTIVE, CLOSED)
     * @param query Optional search query for title/content
     * @param page Page number (0-indexed)
     * @param size Page size
     * @return Paginated list of discussions
     */
    public Page<DiscussionPostResponse> getAllDiscussions(
            Long courseId, 
            String statusStr, 
            String query, 
            int page, 
            int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Page<DiscussionPost> posts;
        
        // Apply filters based on provided parameters
        if (courseId != null && statusStr != null && !statusStr.isEmpty()) {
            // Filter by both course and status
            PostStatus status = PostStatus.valueOf(statusStr);
            posts = discussionPostRepository.findByCourseIdAndStatus(courseId, status, pageable);
            
        } else if (courseId != null) {
            // Filter by course only
            posts = discussionPostRepository.findByCourseId(courseId, pageable);
            
        } else if (statusStr != null && !statusStr.isEmpty()) {
            // Filter by status only
            PostStatus status = PostStatus.valueOf(statusStr);
            posts = discussionPostRepository.findByStatus(status, pageable);
            
        } else {
            // No filters - get all discussions
            posts = discussionPostRepository.findAll(pageable);
        }
        
        // Map to response DTOs
        return posts.map(discussionPostMapper::toResponse);
    }
}
