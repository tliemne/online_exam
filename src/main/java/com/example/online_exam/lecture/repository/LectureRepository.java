package com.example.online_exam.lecture.repository;

import com.example.online_exam.lecture.entity.Lecture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LectureRepository extends JpaRepository<Lecture, Long> {

    List<Lecture> findByCourseIdOrderByOrderIndexAsc(Long courseId);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM Lecture l WHERE l.createdBy.id = :userId")
    void deleteByCreatedById(@Param("userId") Long userId);
}