package com.example.online_exam.discussion.repository;

import com.example.online_exam.discussion.entity.UserViolation;
import com.example.online_exam.discussion.enums.ViolationActionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserViolationRepository extends JpaRepository<UserViolation, Long> {
    
    List<UserViolation> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    Page<UserViolation> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    long countByUserIdAndActionType(Long userId, ViolationActionType actionType);
    
    @Query("SELECT v FROM UserViolation v WHERE v.user.id = :userId AND v.actionType = 'BAN' AND v.isActive = true")
    Optional<UserViolation> findActiveBanByUserId(@Param("userId") Long userId);
    
    @Query("SELECT v FROM UserViolation v WHERE v.user.id = :userId AND v.actionType = 'MUTE' AND v.isActive = true AND v.expiresAt > :now")
    Optional<UserViolation> findActiveMuteByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);
    
    @Query("SELECT v FROM UserViolation v WHERE v.actionType = 'MUTE' AND v.isActive = true AND v.expiresAt <= :now")
    List<UserViolation> findExpiredMutes(@Param("now") LocalDateTime now);
    
    void deleteByPostId(Long postId);
    
    void deleteByReplyId(Long replyId);
    
    void deleteByReportId(Long reportId);
    
    List<UserViolation> findByReportId(Long reportId);
}
