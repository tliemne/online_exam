package com.example.online_exam.user.repository;

import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.enums.RoleName;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
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

    // Admin stats methods
    @Query("SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r.name = :roleName")
    Long countByRolesName(@Param("roleName") RoleName roleName);
    
    @Query("SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r.name = :roleName AND u.createdAt <= :date")
    Long countByRolesNameAndCreatedAtBefore(@Param("roleName") RoleName roleName, @Param("date") LocalDateTime date);
}