package com.example.online_exam.attempt.service;

import com.example.online_exam.attempt.dto.CourseLeaderboardResponse;
import com.example.online_exam.attempt.dto.CourseLeaderboardResponse.StudentRankEntry;
import com.example.online_exam.attempt.entity.Attempt;
import com.example.online_exam.attempt.repository.AttemptRepository;
import com.example.online_exam.course.entity.Course;
import com.example.online_exam.course.repository.CourseRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseLeaderboardService {

    private final AttemptRepository attemptRepo;
    private final CourseRepository  courseRepo;

    @Transactional(readOnly = true)
    public CourseLeaderboardResponse getLeaderboard(Long courseId) {
        Course course = courseRepo.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        // Lấy tất cả attempt đã chấm trong lớp — fetch student + exam sẵn, không cần lazy load
        List<Attempt> attempts = attemptRepo.findForCourseLeaderboard(courseId);

        // Đếm số đề thi trong lớp
        long totalExams = attempts.stream()
                .map(a -> a.getExam().getId())
                .distinct().count();

        if (attempts.isEmpty()) {
            return CourseLeaderboardResponse.builder()
                    .courseId(courseId)
                    .courseName(course.getName())
                    .totalStudents(0)
                    .totalExams((int) totalExams)
                    .ranking(List.of())
                    .build();
        }

        // Group theo studentId
        Map<Long, List<Attempt>> byStudent = attempts.stream()
                .collect(Collectors.groupingBy(a -> a.getStudent().getId()));

        List<StudentRankEntry> ranking = new ArrayList<>();

        for (Map.Entry<Long, List<Attempt>> entry : byStudent.entrySet()) {
            List<Attempt> studentAttempts = entry.getValue();
            Attempt any = studentAttempts.get(0);

            int examsTaken  = studentAttempts.size();
            int examsPassed = (int) studentAttempts.stream()
                    .filter(a -> Boolean.TRUE.equals(a.getPassed())).count();

            // Bài thi điểm cao nhất (theo %)
            Attempt best = studentAttempts.stream()
                    .max(Comparator.comparingDouble(a -> {
                        double max = a.getExam().getTotalScore() != null
                                ? a.getExam().getTotalScore() : 10.0;
                        return max > 0 ? a.getScore() / max : 0;
                    })).orElse(any);

            double bestScoreMax = best.getExam().getTotalScore() != null
                    ? best.getExam().getTotalScore() : 10.0;
            
            // Điểm TB chỉ tính từ điểm cao nhất (không phải trung bình tất cả lần)
            double bestPct = bestScoreMax > 0 ? best.getScore() / bestScoreMax * 100 : 0;

            // Bài thi gần nhất
            String lastExamTitle = studentAttempts.stream()
                    .filter(a -> a.getSubmittedAt() != null)
                    .max(Comparator.comparing(Attempt::getSubmittedAt))
                    .map(a -> a.getExam().getTitle())
                    .orElse("");

            String studentCode = any.getStudent().getStudentProfile() != null
                    ? any.getStudent().getStudentProfile().getStudentCode() : "";

            ranking.add(StudentRankEntry.builder()
                    .studentId(any.getStudent().getId())
                    .studentName(any.getStudent().getFullName())
                    .studentCode(studentCode)
                    .examsTaken(examsTaken)
                    .examsPasssed(examsPassed)
                    .avgScore(Math.round(bestPct * 10.0) / 10.0)
                    .bestScore(best.getScore())
                    .bestScoreMax(bestScoreMax)
                    .lastExamTitle(lastExamTitle)
                    .build());
        }

        // Sort: avgScore DESC, examsPassed DESC
        ranking.sort(Comparator
                .<StudentRankEntry, Double>comparing(StudentRankEntry::getAvgScore).reversed()
                .thenComparing(Comparator.<StudentRankEntry, Integer>comparing(StudentRankEntry::getExamsPasssed).reversed()));

        // Gán rank
        for (int i = 0; i < ranking.size(); i++) {
            ranking.get(i).setRank(i + 1);
        }

        return CourseLeaderboardResponse.builder()
                .courseId(courseId)
                .courseName(course.getName())
                .totalStudents(byStudent.size())
                .totalExams((int) totalExams)
                .ranking(ranking)
                .build();
    }
}