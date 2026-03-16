package com.example.online_exam.announcement.repository;

import com.example.online_exam.announcement.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    @Query("SELECT a FROM Announcement a JOIN FETCH a.author " +
            "WHERE a.course.id = :courseId ORDER BY a.createdAt DESC")
    List<Announcement> findByCourseIdOrderByCreatedAtDesc(@Param("courseId") Long courseId);

    @Query("SELECT a FROM Announcement a JOIN FETCH a.author " +
            "WHERE a.id = :id AND a.course.id = :courseId")
    Optional<Announcement> findByIdAndCourseId(@Param("id") Long id, @Param("courseId") Long courseId);
}