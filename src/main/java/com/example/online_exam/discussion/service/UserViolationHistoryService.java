package com.example.online_exam.discussion.service;

import com.example.online_exam.discussion.dto.UserViolationHistoryDTO;
import com.example.online_exam.discussion.entity.UserViolation;
import com.example.online_exam.discussion.repository.UserViolationRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service để lấy lịch sử vi phạm của user
 * User chỉ có thể xem lịch sử của chính mình
 * Admin có thể xem lịch sử của bất kỳ user nào
 */
@Service
@RequiredArgsConstructor
@Transactional
public class UserViolationHistoryService {

    private final UserViolationRepository violationRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    /**
     * Lấy lịch sử vi phạm của user hiện tại
     */
    public Page<UserViolationHistoryDTO> getMyViolationHistory(Pageable pageable) {
        User currentUser = currentUserService.requireCurrentUser();
        return getViolationHistory(currentUser.getId(), pageable);
    }

    /**
     * Lấy lịch sử vi phạm của user cụ thể (chỉ admin)
     */
    public Page<UserViolationHistoryDTO> getUserViolationHistory(Long userId, Pageable pageable) {
        User currentUser = currentUserService.requireCurrentUser();
        
        // Chỉ admin hoặc chính user đó mới có thể xem
        if (!currentUserService.isAdmin(currentUser) && !currentUser.getId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN, "Bạn không có quyền xem lịch sử vi phạm của user khác");
        }

        return getViolationHistory(userId, pageable);
    }

    /**
     * Lấy lịch sử vi phạm
     */
    private Page<UserViolationHistoryDTO> getViolationHistory(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "User not found"));

        return violationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::mapToDTO);
    }

    /**
     * Lấy tất cả vi phạm của user (không phân trang)
     */
    public List<UserViolationHistoryDTO> getAllViolations(Long userId) {
        User currentUser = currentUserService.requireCurrentUser();
        
        if (!currentUserService.isAdmin(currentUser) && !currentUser.getId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN, "Bạn không có quyền xem lịch sử vi phạm của user khác");
        }

        return violationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    /**
     * Lấy vi phạm gần đây nhất
     */
    public UserViolationHistoryDTO getLatestViolation(Long userId) {
        User currentUser = currentUserService.requireCurrentUser();
        
        if (!currentUserService.isAdmin(currentUser) && !currentUser.getId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN, "Bạn không có quyền xem lịch sử vi phạm của user khác");
        }

        return violationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .findFirst()
                .map(this::mapToDTO)
                .orElse(null);
    }

    /**
     * Map entity to DTO
     */
    private UserViolationHistoryDTO mapToDTO(UserViolation violation) {
        String postTitle = null;
        String postContent = null;
        String replyContent = null;

        if (violation.getPost() != null) {
            postTitle = violation.getPost().getTitle();
            postContent = violation.getPost().getContent();
        } else if (violation.getReply() != null) {
            replyContent = violation.getReply().getContent();
        }

        return UserViolationHistoryDTO.builder()
                .id(violation.getId())
                .actionType(violation.getActionType())
                .reason(violation.getReason())
                .adminName(violation.getAdmin().getFullName() != null ? violation.getAdmin().getFullName() : violation.getAdmin().getUsername())
                .createdAt(violation.getCreatedAt())
                .expiresAt(violation.getExpiresAt())
                .isActive(violation.getIsActive())
                .postTitle(postTitle)
                .postContent(postContent)
                .replyContent(replyContent)
                .violationCreatedAt(violation.getCreatedAt())
                .build();
    }
}
