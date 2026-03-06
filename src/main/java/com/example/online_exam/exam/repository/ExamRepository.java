package com.example.online_exam.exam.repository;

import com.example.online_exam.exam.entity.Exam;
import com.example.online_exam.exam.enums.ExamStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ExamRepository extends JpaRepository<Exam, Long> {

    // Teacher xem đề của lớp mình
    List<Exam> findByCourseId(Long courseId);

    // Student chỉ thấy đề PUBLISHED của lớp mình
    List<Exam> findByCourseIdAndStatus(Long courseId, ExamStatus status);

    // Admin xem tất cả
    @Query("""
        SELECT e FROM Exam e
        WHERE (:courseId IS NULL OR e.course.id = :courseId)
          AND (:status   IS NULL OR e.status = :status)
        ORDER BY e.createdAt DESC
    """)
    List<Exam> search(
            @Param("courseId") Long courseId,
            @Param("status")   ExamStatus status
    );

    // Lấy các lớp mà student đã enroll → tìm đề PUBLISHED
    @Query("""
        SELECT e FROM Exam e
        WHERE e.course.id IN (
            SELECT c.id FROM Course c JOIN c.students s WHERE s.id = :studentId
        )
        AND e.status = 'PUBLISHED'
        ORDER BY e.startTime DESC
    """)
    List<Exam> findPublishedForStudent(@Param("studentId") Long studentId);
}