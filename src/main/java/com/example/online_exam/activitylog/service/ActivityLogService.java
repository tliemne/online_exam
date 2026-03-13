package com.example.online_exam.activitylog.service;

import com.example.online_exam.activitylog.dto.ActivityLogResponse;
import com.example.online_exam.activitylog.entity.ActivityLog;
import com.example.online_exam.activitylog.entity.ActivityLogAction;
import com.example.online_exam.activitylog.repository.ActivityLogRepository;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.repository.UserRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityLogService {

    private final ActivityLogRepository repo;
    private final UserRepository userRepository;

    // ── Ghi log — nhận userId thay vì User entity (tránh LazyInit) ──
    @Async
    public void log(Long userId, ActivityLogAction action,
                    String targetType, Long targetId,
                    String description, String ip) {
        try {
            ActivityLog entry = new ActivityLog();
            // Load fresh user trong session mới của @Async thread
            if (userId != null) {
                userRepository.findById(userId).ifPresent(entry::setUser);
            }
            entry.setAction(action.name());
            entry.setTargetType(targetType);
            entry.setTargetId(targetId);
            entry.setDescription(description);
            entry.setIpAddress(ip);
            repo.save(entry);
        } catch (Exception e) {
            log.warn("Failed to save activity log: {}", e.getMessage());
        }
    }

    @Async
    public void log(Long userId, ActivityLogAction action,
                    String targetType, Long targetId, String description) {
        log(userId, action, targetType, targetId, description, null);
    }

    // Overload tiện dụng nhận User — extract id ngay, không giữ reference
    public void logUser(User user, ActivityLogAction action,
                        String targetType, Long targetId, String description) {
        Long uid = user != null ? user.getId() : null;
        log(uid, action, targetType, targetId, description, null);
    }

    // ── Admin search ─────────────────────────────────────────
    public Page<ActivityLogResponse> search(
            String action, Long userId, String keyword,
            LocalDateTime from, LocalDateTime to,
            int page, int size) {

        Specification<ActivityLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            Join<Object, Object> userJoin = root.join("user", JoinType.LEFT);

            if (action != null && !action.isBlank()) {
                predicates.add(cb.equal(root.get("action"), action));
            }
            if (userId != null) {
                predicates.add(cb.equal(userJoin.get("id"), userId));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.toLowerCase() + "%";
                Predicate byUsername    = cb.like(cb.lower(userJoin.get("username")), pattern);
                Predicate byDescription = cb.like(cb.lower(root.get("description")), pattern);
                predicates.add(cb.or(byUsername, byDescription));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        PageRequest pr = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return repo.findAll(spec, pr).map(this::toDto);
    }

    private ActivityLogResponse toDto(ActivityLog a) {
        return ActivityLogResponse.builder()
                .id(a.getId())
                .userId(a.getUser() != null ? a.getUser().getId() : null)
                .username(a.getUser() != null ? a.getUser().getUsername() : "system")
                .fullName(a.getUser() != null ? a.getUser().getFullName() : "")
                .action(a.getAction())
                .targetType(a.getTargetType())
                .targetId(a.getTargetId())
                .description(a.getDescription())
                .ipAddress(a.getIpAddress())
                .createdAt(a.getCreatedAt())
                .build();
    }
}