package com.example.online_exam.course.repository;

import com.example.online_exam.course.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {

    List<Course> findByTeacherId(Long teacherId);
    List<Course> findByStudents_Id(Long studentId);
    Optional<Course> findByIdAndTeacherId(Long id, Long teacherId);
    Optional<Course> findByIdAndStudents_Id(Long id, Long studentId);

    // Khi xóa teacher: giữ lại lớp học, chỉ null teacher_id
    @Modifying
    @Query("UPDATE Course c SET c.teacher = null WHERE c.teacher.id = :teacherId")
    void nullifyTeacher(@Param("teacherId") Long teacherId);

    // Khi xóa student: xóa khỏi tất cả lớp học
    @Modifying
    @Query(value = "DELETE FROM course_students WHERE student_id = :studentId", nativeQuery = true)
    void removeStudentFromAllCourses(@Param("studentId") Long studentId);
}