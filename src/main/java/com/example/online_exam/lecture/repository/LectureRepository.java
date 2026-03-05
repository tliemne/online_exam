package com.example.online_exam.lecture.repository;

import com.example.online_exam.lecture.entity.Lecture;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LectureRepository extends JpaRepository<Lecture, Long> {
    List<Lecture> findByCourseIdOrderByOrderIndexAsc(Long courseId);
}