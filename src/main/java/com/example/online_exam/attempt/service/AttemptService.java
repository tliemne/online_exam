package com.example.online_exam.attempt.service;

import com.example.online_exam.attempt.dto.*;
import java.util.List;

public interface AttemptService {

    // Student bắt đầu bài thi → tạo attempt IN_PROGRESS
    AttemptResponse startExam(Long examId);

    // Student nộp bài (từ attemptId)
    AttemptResponse submitAttempt(Long attemptId, List<SubmitAnswerItem> answers);

    // Giữ tương thích cũ
    AttemptResponse submit(Long examId, List<SubmitAnswerItem> answers);

    // Lấy kết quả của 1 attempt
    AttemptResponse getById(Long attemptId);

    // Student xem lịch sử bài làm của mình
    List<AttemptResponse> getMyAttempts();

    // Student xem lịch sử cho 1 exam
    List<AttemptResponse> getMyAttemptsByExam(Long examId);

    // Lấy attempt đang dở (IN_PROGRESS) của student cho 1 exam
    AttemptResponse getMyInProgress(Long examId);

    // Teacher xem tất cả bài nộp của 1 exam
    List<AttemptResponse> getByExam(Long examId);

    // Teacher chấm điểm (tự luận)
    AttemptResponse grade(Long attemptId, GradeRequest req);

    // Teacher/Admin reset bài thi của student (xóa attempt → student làm lại)
    void resetAttempt(Long attemptId);

    long countPendingByExam(Long examId);

    // Student gửi heartbeat — lưu thời gian + tab + answers tạm
    void heartbeat(Long attemptId, int timeRemainingSeconds, int tabViolationCount,
                   java.util.List<SubmitAnswerItem> answers);
}