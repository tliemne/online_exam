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

        return buildLeaderboard(course, byStudent, totalExams);
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<CourseLeaderboardResponse> getLeaderboardPaginated(Long courseId, int page, int size) {
        Course course = courseRepo.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        // Lấy tất cả attempt đã chấm trong lớp
        List<Attempt> attempts = attemptRepo.findForCourseLeaderboard(courseId);

        // Đếm số đề thi trong lớp
        long totalExams = attempts.stream()
                .map(a -> a.getExam().getId())
                .distinct().count();

        if (attempts.isEmpty()) {
            CourseLeaderboardResponse emptyResponse = CourseLeaderboardResponse.builder()
                    .courseId(courseId)
                    .courseName(course.getName())
                    .totalStudents(0)
                    .totalExams((int) totalExams)
                    .ranking(List.of())
                    .build();
            return new org.springframework.data.domain.PageImpl<>(
                List.of(emptyResponse), 
                org.springframework.data.domain.PageRequest.of(page, size), 
                1);
        }

        // Group theo studentId
        Map<Long, List<Attempt>> byStudent = attempts.stream()
                .collect(Collectors.groupingBy(a -> a.getStudent().getId()));

        CourseLeaderboardResponse fullResponse = buildLeaderboard(course, byStudent, totalExams);
        
        // Paginate the ranking list
        List<StudentRankEntry> allRankings = fullResponse.getRanking();
        int start = page * size;
        int end = Math.min(start + size, allRankings.size());
        List<StudentRankEntry> paginatedRankings = start < allRankings.size() 
            ? allRankings.subList(start, end) 
            : List.of();

        CourseLeaderboardResponse paginatedResponse = CourseLeaderboardResponse.builder()
                .courseId(fullResponse.getCourseId())
                .courseName(fullResponse.getCourseName())
                .totalStudents(fullResponse.getTotalStudents())
                .totalExams(fullResponse.getTotalExams())
                .ranking(paginatedRankings)
                .build();

        return new org.springframework.data.domain.PageImpl<>(
            List.of(paginatedResponse), 
            org.springframework.data.domain.PageRequest.of(page, size), 
            (allRankings.size() + size - 1) / size); // Total pages
    }

    private CourseLeaderboardResponse buildLeaderboard(Course course, Map<Long, List<Attempt>> byStudent, long totalExams) {

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
                .courseId(course.getId())
                .courseName(course.getName())
                .totalStudents(byStudent.size())
                .totalExams((int) totalExams)
                .ranking(ranking)
                .build();
    }
}