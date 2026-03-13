package com.example.online_exam.auth.repository;

import com.example.online_exam.auth.entity.RefreshToken;
import com.example.online_exam.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    void deleteByUser(User user);

    @Modifying
    @Query(value = "DELETE FROM refresh_tokens WHERE user_id = :userId", nativeQuery = true)
    void deleteByUserId(@Param("userId") Long userId);

    // Xóa tất cả token đã hết hạn — dùng cho scheduled cleanup
    @Modifying
    @Query("DELETE FROM RefreshToken t WHERE t.expiryDate < :now")
    int deleteAllExpiredBefore(@Param("now") LocalDateTime now);
}