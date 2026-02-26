package com.example.online_exam.config;

import com.example.online_exam.user.entity.Role;
import com.example.online_exam.user.enums.RoleName;
import com.example.online_exam.user.repository.RoleRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer {
    private final RoleRepository roleRepository;
    @PostConstruct
    public void initRoles() {
        for (RoleName roleName : RoleName.values()) {
            roleRepository.findByName(roleName)
                    .orElseGet(() -> roleRepository.save(
                            new Role(roleName)
                    ));
        }
    }
}
