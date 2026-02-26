package com.example.online_exam.course.repository;

import com.example.online_exam.course.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByTeacherId(Long teacherId);
    List<Course> findByStudents_Id(Long studentId);
    Optional<Course> findByIdAndTeacherId(Long Id, Long teacherId);
    Optional<Course> findByIdAndStudents_Id(Long Id, Long studentId);
}
