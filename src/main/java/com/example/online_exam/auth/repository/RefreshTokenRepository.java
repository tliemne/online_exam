package com.example.online_exam.auth.repository;

import com.example.online_exam.auth.entity.RefreshToken;
import com.example.online_exam.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);

    void deleteByUser(User user);
}
