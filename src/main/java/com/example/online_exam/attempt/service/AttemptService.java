package com.example.online_exam.attempt.service;

import com.example.online_exam.attempt.dto.*;
import java.util.List;

public interface AttemptService {

    // Student nộp bài
    AttemptResponse submit(Long examId, List<SubmitAnswerItem> answers);

    // Lấy kết quả của 1 attempt
    AttemptResponse getById(Long attemptId);

    // Student xem lịch sử bài làm của mình
    List<AttemptResponse> getMyAttempts();

    // Student xem lịch sử cho 1 exam
    List<AttemptResponse> getMyAttemptsByExam(Long examId);

    // Teacher xem tất cả bài nộp của 1 exam
    List<AttemptResponse> getByExam(Long examId);

    // Teacher chấm điểm (tự luận)
    AttemptResponse grade(Long attemptId, GradeRequest req);

    // Teacher/Admin reset bài thi của student (xóa attempt → student làm lại)
    void resetAttempt(Long attemptId);
}