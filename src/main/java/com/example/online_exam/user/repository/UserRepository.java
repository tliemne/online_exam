package com.example.online_exam.user.repository;

import com.example.online_exam.user.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    // Eager load profiles để tránh lazy load fail khi map sang DTO
    @EntityGraph(attributePaths = {"studentProfile", "teacherProfile", "roles"})
    List<User> findAllBy();
}