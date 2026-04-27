package com.example.online_exam.discussion.repository;

import com.example.online_exam.discussion.entity.ViolationNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ViolationNotificationRepository extends JpaRepository<ViolationNotification, Long> {

    /**
     * Lấy tất cả thông báo của user, sắp xếp theo mới nhất
     */
    Page<ViolationNotification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Lấy thông báo chưa đọc của user
     */
    Page<ViolationNotification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Đếm thông báo chưa đọc
     */
    long countByUserIdAndIsReadFalse(Long userId);

    /**
     * Lấy thông báo chưa gửi email
     */
    @Query("SELECT vn FROM ViolationNotification vn WHERE vn.emailSent = false AND vn.sentAt IS NOT NULL ORDER BY vn.createdAt ASC")
    List<ViolationNotification> findUnsentEmailNotifications();

    /**
     * Lấy thông báo chưa gửi email của user cụ thể
     */
    @Query("SELECT vn FROM ViolationNotification vn WHERE vn.user.id = :userId AND vn.emailSent = false ORDER BY vn.createdAt DESC")
    List<ViolationNotification> findUnsentEmailNotificationsByUserId(@Param("userId") Long userId);

    /**
     * Lấy thông báo mute đang hoạt động (chưa hết hạn)
     */
    @Query("SELECT vn FROM ViolationNotification vn WHERE vn.user.id = :userId AND vn.actionType = 'MUTE' AND vn.expiresAt > :now ORDER BY vn.expiresAt DESC")
    List<ViolationNotification> findActiveMuteNotifications(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    /**
     * Lấy thông báo ban (vĩnh viễn)
     */
    @Query("SELECT vn FROM ViolationNotification vn WHERE vn.user.id = :userId AND vn.actionType = 'BAN' ORDER BY vn.createdAt DESC")
    List<ViolationNotification> findBanNotifications(@Param("userId") Long userId);
    
    @Modifying
    @Query("DELETE FROM ViolationNotification vn WHERE vn.violation.post.id = :postId")
    void deleteByPostId(@Param("postId") Long postId);
    
    @Modifying
    @Query("DELETE FROM ViolationNotification vn WHERE vn.violation.reply.id = :replyId")
    void deleteByReplyId(@Param("replyId") Long replyId);
}
