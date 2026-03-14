package com.example.online_exam.activitylog.repository;

import com.example.online_exam.activitylog.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface ActivityLogRepository
        extends JpaRepository<ActivityLog, Long>,
        JpaSpecificationExecutor<ActivityLog> {

    // Xóa log cũ hơn N ngày — dùng cho scheduled cleanup
    @Modifying
    @Query("DELETE FROM ActivityLog a WHERE a.createdAt < :cutoff")
    int deleteOlderThan(@Param("cutoff") LocalDateTime cutoff);

    // Xóa toàn bộ log của 1 user — dùng khi xóa tài khoản
    @Modifying
    @Query("DELETE FROM ActivityLog a WHERE a.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}