package com.example.online_exam.attempt.repository;

import com.example.online_exam.attempt.entity.AttemptAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AttemptAnswerRepository extends JpaRepository<AttemptAnswer, Long> {

    List<AttemptAnswer> findByAttemptId(Long attemptId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM AttemptAnswer aa WHERE aa.attempt.id = :attemptId")
    void deleteByAttemptId(@Param("attemptId") Long attemptId);

    // Xóa attempt_answers có selected_answer thuộc question này (trước khi xóa câu hỏi)
    @Modifying
    @Query("DELETE FROM AttemptAnswer aa WHERE aa.selectedAnswer.question.id = :questionId")
    void deleteByQuestionId(@Param("questionId") Long questionId);

    // Nullify selected_answer nếu không muốn xóa cả attempt_answer
    @Modifying
    @Query("UPDATE AttemptAnswer aa SET aa.selectedAnswer = null WHERE aa.selectedAnswer.question.id = :questionId")
    void nullifySelectedAnswerByQuestionId(@Param("questionId") Long questionId);

    // Xóa tất cả answers của các attempt thuộc student này
    @Modifying
    @Query("DELETE FROM AttemptAnswer aa WHERE aa.attempt.student.id = :studentId")
    void deleteByAttemptStudentId(@Param("studentId") Long studentId);

    // Xóa tất cả answers của các attempt thuộc exam do user này tạo
    @Modifying
    @Query("DELETE FROM AttemptAnswer aa WHERE aa.attempt.exam.createdBy.id = :userId")
    void deleteByAttemptExamCreatedById(@Param("userId") Long userId);
}