package com.example.online_exam.user.repository;

import com.example.online_exam.user.entity.Role;
import com.example.online_exam.user.enums.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleName name);
}
