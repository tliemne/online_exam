package com.example.online_exam.discussion.service;

import com.example.online_exam.course.entity.Course;
import com.example.online_exam.course.repository.CourseRepository;
import com.example.online_exam.discussion.dto.DiscussionPostResponse;
import com.example.online_exam.discussion.dto.DiscussionSearchRequest;
import com.example.online_exam.discussion.entity.DiscussionPost;
import com.example.online_exam.discussion.enums.PostStatus;
import com.example.online_exam.discussion.mapper.DiscussionPostMapper;
import com.example.online_exam.discussion.repository.DiscussionPostRepository;
import com.example.online_exam.discussion.repository.DiscussionVoteRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.enums.RoleName;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class DiscussionSearchService {

    private final DiscussionPostRepository discussionPostRepository;
    private final CourseRepository courseRepository;
    private final DiscussionVoteRepository discussionVoteRepository;
    private final DiscussionPostMapper discussionPostMapper;
    private final CurrentUserService currentUserService;
    private final EntityManager entityManager;

    /**
     * Task 9.1-9.4: Search posts with filters and sorting
     */
    public Page<DiscussionPostResponse> searchPosts(Long courseId, DiscussionSearchRequest request, int page, int size) {
        User currentUser = currentUserService.requireCurrentUser();
        
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        
        validateCourseMembership(currentUser, course);
        
        // Validate pagination size
        if (size < 10 || size > 50) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Page size must be between 10 and 50");
        }
        
        // Build criteria query
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<DiscussionPost> query = cb.createQuery(DiscussionPost.class);
        Root<DiscussionPost> root = query.from(DiscussionPost.class);
        
        List<Predicate> predicates = new ArrayList<>();
        
        // Course filter
        predicates.add(cb.equal(root.get("course").get("id"), courseId));
        
        // Status filter (only ACTIVE)
        predicates.add(cb.equal(root.get("status"), PostStatus.ACTIVE));
        
        // Keyword filter (title OR content)
        if (request.getKeyword() != null && !request.getKeyword().trim().isEmpty()) {
            String keyword = "%" + request.getKeyword().toLowerCase() + "%";
            Predicate titleMatch = cb.like(cb.lower(root.get("title")), keyword);
            Predicate contentMatch = cb.like(cb.lower(root.get("content")), keyword);
            predicates.add(cb.or(titleMatch, contentMatch));
        }
        
        // Tag filter
        if (request.getTags() != null && !request.getTags().isEmpty()) {
            Join<Object, Object> tagsJoin = root.join("tags", JoinType.INNER);
            predicates.add(tagsJoin.get("name").in(request.getTags()));
        }
        
        // Answered status filter
        if (request.getAnswered() != null) {
            predicates.add(cb.equal(root.get("hasBestAnswer"), request.getAnswered()));
        }
        
        query.where(predicates.toArray(new Predicate[0]));
        
        // Sorting
        String sortBy = request.getSortBy() != null ? request.getSortBy() : "date";
        String sortDirection = request.getSortDirection() != null ? request.getSortDirection() : "desc";
        
        Order order;
        switch (sortBy.toLowerCase()) {
            case "votes":
                order = sortDirection.equalsIgnoreCase("asc") 
                    ? cb.asc(root.get("voteCount")) 
                    : cb.desc(root.get("voteCount"));
                break;
            case "replies":
                order = sortDirection.equalsIgnoreCase("asc") 
                    ? cb.asc(root.get("replyCount")) 
                    : cb.desc(root.get("replyCount"));
                break;
            case "date":
            default:
                order = sortDirection.equalsIgnoreCase("asc") 
                    ? cb.asc(root.get("createdAt")) 
                    : cb.desc(root.get("createdAt"));
                break;
        }
        query.orderBy(order);
        
        // Execute query with pagination
        List<DiscussionPost> posts = entityManager.createQuery(query)
                .setFirstResult(page * size)
                .setMaxResults(size)
                .getResultList();
        
        // Count total results
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<DiscussionPost> countRoot = countQuery.from(DiscussionPost.class);
        countQuery.select(cb.count(countRoot));
        
        List<Predicate> countPredicates = new ArrayList<>();
        countPredicates.add(cb.equal(countRoot.get("course").get("id"), courseId));
        countPredicates.add(cb.equal(countRoot.get("status"), PostStatus.ACTIVE));
        
        if (request.getKeyword() != null && !request.getKeyword().trim().isEmpty()) {
            String keyword = "%" + request.getKeyword().toLowerCase() + "%";
            Predicate titleMatch = cb.like(cb.lower(countRoot.get("title")), keyword);
            Predicate contentMatch = cb.like(cb.lower(countRoot.get("content")), keyword);
            countPredicates.add(cb.or(titleMatch, contentMatch));
        }
        
        if (request.getTags() != null && !request.getTags().isEmpty()) {
            Join<Object, Object> tagsJoin = countRoot.join("tags", JoinType.INNER);
            countPredicates.add(tagsJoin.get("name").in(request.getTags()));
        }
        
        if (request.getAnswered() != null) {
            countPredicates.add(cb.equal(countRoot.get("hasBestAnswer"), request.getAnswered()));
        }
        
        countQuery.where(countPredicates.toArray(new Predicate[0]));
        Long total = entityManager.createQuery(countQuery).getSingleResult();
        
        // Map to response
        List<DiscussionPostResponse> responses = posts.stream()
                .map(post -> {
                    DiscussionPostResponse response = discussionPostMapper.toResponse(post);
                    discussionVoteRepository.findByUserIdAndPostId(currentUser.getId(), post.getId())
                            .ifPresent(vote -> response.setCurrentUserVote(vote.getVoteType().name()));
                    return response;
                })
                .toList();
        
        Pageable pageable = PageRequest.of(page, size);
        return new PageImpl<>(responses, pageable, total);
    }

    // ── Helper methods ──────────────────────────────────────────────

    private void validateCourseMembership(User user, Course course) {
        boolean isAdmin = currentUserService.isAdmin(user);
        boolean isTeacher = currentUserService.hasRole(user, RoleName.TEACHER) &&
                (course.getTeachers().stream().anyMatch(t -> t.getId().equals(user.getId())) ||
                 (course.getCreatedBy() != null && course.getCreatedBy().getId().equals(user.getId())));
        boolean isStudent = currentUserService.hasRole(user, RoleName.STUDENT) &&
                course.getStudents().stream().anyMatch(s -> s.getId().equals(user.getId()));
        
        if (!isAdmin && !isTeacher && !isStudent) {
            throw new AppException(ErrorCode.FORBIDDEN, "You are not a member of this course");
        }
    }
}
