package com.example.online_exam.userprofile.repository;

import com.example.online_exam.userprofile.entity.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {
    Optional<StudentProfile> findByUserId(Long userId);
    boolean existsByStudentCode(String studentCode);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM StudentProfile sp WHERE sp.user.id = :userId")
    void deleteByUserId(Long userId);
}