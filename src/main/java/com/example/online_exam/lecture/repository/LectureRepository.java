package com.example.online_exam.lecture.repository;

import com.example.online_exam.lecture.entity.Lecture;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LectureRepository extends JpaRepository<Lecture, Long> {

    List<Lecture> findByCourseIdOrderByOrderIndexAsc(Long courseId);

    // Xóa toàn bộ lecture do 1 teacher tạo (dùng khi xóa tài khoản teacher)
    void deleteByCreatedById(Long userId);
}