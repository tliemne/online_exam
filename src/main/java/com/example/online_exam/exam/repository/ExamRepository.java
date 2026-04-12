package com.example.online_exam.exam.repository;

import com.example.online_exam.exam.entity.Exam;
import com.example.online_exam.exam.enums.ExamStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ExamRepository extends JpaRepository<Exam, Long> {

    List<Exam> findByCourseId(Long courseId);
    List<Exam> findByCourseIdAndStatus(Long courseId, ExamStatus status);

    @Query("""
        SELECT e FROM Exam e
        WHERE (:courseId IS NULL OR e.course.id = :courseId)
          AND (:status   IS NULL OR e.status = :status)
        ORDER BY e.createdAt DESC
    """)
    List<Exam> search(@Param("courseId") Long courseId, @Param("status") ExamStatus status);

    @Query("""
        SELECT e FROM Exam e
        WHERE e.course.id IN (
            SELECT c.id FROM Course c JOIN c.students s WHERE s.id = :studentId
        )
        AND e.status = 'PUBLISHED'
        ORDER BY e.startTime DESC
    """)
    List<Exam> findPublishedForStudent(@Param("studentId") Long studentId);

    List<Exam> findByCreatedById(Long userId);

    /** Lấy đề trong lớp mà user là giáo viên phụ trách */
    @Query("SELECT e FROM Exam e WHERE e.course.teacher.id = :teacherId ORDER BY e.createdAt DESC")
    List<Exam> findByCourseTeacherId(@Param("teacherId") Long teacherId);

    @Modifying
    @Query("DELETE FROM Exam e WHERE e.createdBy.id = :userId")
    void deleteByCreatedById(@Param("userId") Long userId);
}