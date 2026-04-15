package com.example.online_exam.dashboard.service;

import com.example.online_exam.attempt.entity.Attempt;
import com.example.online_exam.attempt.enums.AttemptStatus;
import com.example.online_exam.attempt.repository.AttemptRepository;
import com.example.online_exam.course.entity.Course;
import com.example.online_exam.course.repository.CourseRepository;
import com.example.online_exam.dashboard.dto.DashboardResponse;
import com.example.online_exam.exam.entity.Exam;
import com.example.online_exam.exam.enums.ExamStatus;
import com.example.online_exam.exam.repository.ExamRepository;
import com.example.online_exam.question.repository.QuestionRepository;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.enums.RoleName;
import com.example.online_exam.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class DashboardService {

    private final UserRepository     userRepo;
    private final CourseRepository   courseRepo;
    private final ExamRepository     examRepo;
    private final AttemptRepository  attemptRepo;
    private final CurrentUserService currentUserService;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    // ── ADMIN ─────────────────────────────────────────────
    public DashboardResponse.Admin adminStats() {
        List<User> allUsers = userRepo.findAllBy();

        long students = allUsers.stream()
                .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName() == RoleName.STUDENT)).count();
        long teachers = allUsers.stream()
                .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName() == RoleName.TEACHER)).count();

        long totalCourses  = courseRepo.count();
        long totalExams    = examRepo.count();
        long publishedExams = examRepo.findAll().stream()
                .filter(e -> e.getStatus() == ExamStatus.PUBLISHED).count();

        List<Attempt> allAttempts = attemptRepo.findAll();
        List<Attempt> graded = allAttempts.stream()
                .filter(a -> a.getStatus() == AttemptStatus.GRADED).collect(Collectors.toList());

        double avgScore = graded.stream()
                .filter(a -> a.getScore() != null)
                .mapToDouble(Attempt::getScore).average().orElse(0);

        long passed   = graded.stream().filter(a -> Boolean.TRUE.equals(a.getPassed())).count();
        double passRate = graded.isEmpty() ? 0 : Math.round((double) passed / graded.size() * 1000.0) / 10.0;

        // 8 bài làm gần nhất
        List<DashboardResponse.RecentAttempt> recent = allAttempts.stream()
                .filter(a -> a.getSubmittedAt() != null)
                .sorted((a, b) -> b.getSubmittedAt().compareTo(a.getSubmittedAt()))
                .limit(8)
                .map(this::toRecentAttempt)
                .collect(Collectors.toList());

        // ── Monthly Attempts Chart (6 tháng gần nhất) ──
        List<DashboardResponse.MonthlyAttempt> monthlyAttempts = calculateMonthlyAttempts(allAttempts);

        // ── Score Distribution Chart ──
        DashboardResponse.ScoreDistribution scoreDistribution = calculateScoreDistribution(graded);

        return DashboardResponse.Admin.builder()
                .totalUsers(allUsers.size())
                .totalStudents(students)
                .totalTeachers(teachers)
                .totalCourses(totalCourses)
                .totalExams(totalExams)
                .publishedExams(publishedExams)
                .totalAttempts(allAttempts.size())
                .avgScore(Math.round(avgScore * 10.0) / 10.0)
                .passRate(passRate)
                .recentAttempts(recent)
                .monthlyAttempts(monthlyAttempts)
                .scoreDistribution(scoreDistribution)
                .build();
    }

    // ── Calculate Monthly Attempts (6 months) ──
    private List<DashboardResponse.MonthlyAttempt> calculateMonthlyAttempts(List<Attempt> attempts) {
        // Lấy 6 tháng gần nhất
        YearMonth now = YearMonth.now();
        List<YearMonth> last6Months = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            last6Months.add(now.minusMonths(i));
        }

        // Đếm số bài thi theo tháng
        Map<YearMonth, Long> countByMonth = attempts.stream()
                .filter(a -> a.getSubmittedAt() != null)
                .collect(Collectors.groupingBy(
                        a -> YearMonth.from(a.getSubmittedAt()),
                        Collectors.counting()
                ));

        // Tạo kết quả với format "Tháng X/YYYY"
        return last6Months.stream()
                .map(ym -> DashboardResponse.MonthlyAttempt.builder()
                        .month("Tháng " + ym.getMonthValue() + "/" + ym.getYear())
                        .count(countByMonth.getOrDefault(ym, 0L).intValue())
                        .build())
                .collect(Collectors.toList());
    }

    // ── Calculate Score Distribution ──
    private DashboardResponse.ScoreDistribution calculateScoreDistribution(List<Attempt> gradedAttempts) {
        int excellent = 0;  // 9-10
        int good = 0;       // 8-9
        int fair = 0;       // 7-8
        int average = 0;    // 5-7
        int poor = 0;       // <5

        for (Attempt a : gradedAttempts) {
            if (a.getScore() == null || a.getTotalScore() == null || a.getTotalScore() == 0) continue;
            
            // Chuẩn hóa điểm về thang 10
            double normalizedScore = (a.getScore() / a.getTotalScore()) * 10.0;
            
            if (normalizedScore >= 9.0) excellent++;
            else if (normalizedScore >= 8.0) good++;
            else if (normalizedScore >= 7.0) fair++;
            else if (normalizedScore >= 5.0) average++;
            else poor++;
        }

        return DashboardResponse.ScoreDistribution.builder()
                .excellent(excellent)
                .good(good)
                .fair(fair)
                .average(average)
                .poor(poor)
                .build();
    }

    // ── TEACHER ───────────────────────────────────────────
    public DashboardResponse.Teacher teacherStats() {
        User teacher = currentUserService.requireCurrentUser();
        log.info("[Dashboard] ===== START teacherStats for teacher={} =====", teacher.getId());

        // Lấy tất cả courses của teacher (created by hoặc là member)
        List<Course> courses = courseRepo.findByTeacherId(teacher.getId());
        
        // Lấy tất cả exams của teacher (created by) + exams trong courses của teacher
        List<Exam> allExams = new ArrayList<>();
        allExams.addAll(examRepo.findByCreatedById(teacher.getId()));
        
        for (Course c : courses) {
            allExams.addAll(examRepo.findByCourseId(c.getId()));
        }
        
        // Remove duplicates
        List<Exam> exams = allExams.stream().distinct().collect(Collectors.toList());
        
        log.info("[Dashboard] Found {} courses, {} exams", courses.size(), exams.size());

        long publishedExams = exams.stream()
                .filter(e -> e.getStatus() == ExamStatus.PUBLISHED).count();

        // Gom tất cả attempt của đề mà teacher có quyền (chỉ SUBMITTED + GRADED)
        List<Long> examIds = exams.stream().map(Exam::getId).collect(Collectors.toList());
        log.info("[Dashboard] examIds: {}", examIds);
        
        List<Attempt> allAttempts = attemptRepo.findAll();
        log.info("[Dashboard] Total attempts in DB: {}", allAttempts.size());
        
        List<Attempt> myAttempts = allAttempts.stream()
                .filter(a -> examIds.contains(a.getExam().getId()))
                .filter(a -> a.getStatus() == AttemptStatus.SUBMITTED || a.getStatus() == AttemptStatus.GRADED)
                .collect(Collectors.toList());
        log.info("[Dashboard] Filtered myAttempts (SUBMITTED+GRADED): {}", myAttempts.size());
        for (Attempt a : myAttempts) {
            log.info("[Dashboard]   - Attempt {} exam={} status={}", a.getId(), a.getExam().getId(), a.getStatus());
        }

        long pending = myAttempts.stream()
                .filter(a -> a.getStatus() == AttemptStatus.SUBMITTED).count();

        List<Attempt> graded = myAttempts.stream()
                .filter(a -> a.getStatus() == AttemptStatus.GRADED).collect(Collectors.toList());

        double avg = graded.stream().filter(a -> a.getScore() != null)
                .mapToDouble(Attempt::getScore).average().orElse(0);
        long passed = graded.stream().filter(a -> Boolean.TRUE.equals(a.getPassed())).count();
        double passRate = graded.isEmpty() ? 0 : Math.round((double) passed / graded.size() * 1000.0) / 10.0;

        // Stats từng lớp
        List<DashboardResponse.CourseStats> courseStats = courses.stream().map(c -> {
            List<Exam> cExams = exams.stream()
                    .filter(e -> e.getCourse() != null && e.getCourse().getId().equals(c.getId()))
                    .collect(Collectors.toList());
            List<Long> cExamIds = cExams.stream().map(Exam::getId).collect(Collectors.toList());
            log.info("[Dashboard] Course {} cExamIds: {}", c.getId(), cExamIds);
            
            List<Attempt> cAttempts = myAttempts.stream()
                    .filter(a -> cExamIds.contains(a.getExam().getId()))
                    .collect(Collectors.toList());
            log.info("[Dashboard] Course {} cAttempts: {}", c.getId(), cAttempts.size());
            
            List<Attempt> cGraded = cAttempts.stream()
                    .filter(a -> a.getStatus() != null && a.getStatus().name().equals("GRADED"))
                    .collect(Collectors.toList());
            Integer cPassRate = cGraded.isEmpty() ? null
                    : (int) Math.round((double) cGraded.stream().filter(a -> Boolean.TRUE.equals(a.getPassed())).count()
                    / cGraded.size() * 100);
            return DashboardResponse.CourseStats.builder()
                    .courseId(c.getId())
                    .courseName(c.getName())
                    .studentCount(c.getStudents() != null ? c.getStudents().size() : 0)
                    .examCount(cExams.size())
                    .attemptCount(cAttempts.size())
                    .passRate(cPassRate)
                    .build();
        }).collect(Collectors.toList());

        // ── Monthly Attempts Chart (6 tháng gần nhất) ──
        List<DashboardResponse.MonthlyAttempt> monthlyAttempts = calculateMonthlyAttempts(myAttempts);

        // ── Score Distribution Chart ──
        DashboardResponse.ScoreDistribution scoreDistribution = calculateScoreDistribution(graded);

        log.info("[Dashboard] ===== END teacherStats =====");
        DashboardResponse.Teacher response = DashboardResponse.Teacher.builder()
                .myCourses(courses.size())
                .myExams(exams.size())
                .publishedExams(publishedExams)
                .pendingGrading(pending)
                .totalAttempts(myAttempts.size())
                .avgScore(Math.round(avg * 10.0) / 10.0)
                .passRate(passRate)
                .courseStats(courseStats)
                .monthlyAttempts(monthlyAttempts)
                .scoreDistribution(scoreDistribution)
                .build();
        log.info("[Dashboard] Response courseStats: {}", courseStats.stream()
                .map(c -> c.getCourseName() + "=" + c.getAttemptCount())
                .collect(Collectors.toList()));
        return response;
    }

    // ── STUDENT ───────────────────────────────────────────
    public DashboardResponse.Student studentStats() {
        User student = currentUserService.requireCurrentUser();

        List<Course>  courses  = courseRepo.findByStudents_Id(student.getId());
        List<Exam>    exams    = examRepo.findPublishedForStudent(student.getId());
        
        // Lấy TẤT CẢ attempts của student
        List<Attempt> allAttempts = attemptRepo.findSubmittedByStudent(student.getId());
        
        // Nhóm theo examId và chỉ lấy attempt có điểm cao nhất của mỗi exam
        Map<Long, Attempt> bestAttemptsByExam = allAttempts.stream()
                .filter(a -> a.getStatus() == AttemptStatus.GRADED) // Chỉ lấy bài đã chấm
                .filter(a -> a.getScore() != null) // Phải có điểm
                .collect(Collectors.toMap(
                        a -> a.getExam().getId(),
                        a -> a,
                        (a1, a2) -> a1.getScore() > a2.getScore() ? a1 : a2 // Lấy điểm cao hơn
                ));
        
        // Danh sách attempts để hiển thị (chỉ lần thi tốt nhất của mỗi exam)
        List<Attempt> attempts = new ArrayList<>(bestAttemptsByExam.values());
        
        // Sort theo thời gian submit (mới nhất trước)
        attempts.sort((a1, a2) -> {
            if (a2.getSubmittedAt() == null) return -1;
            if (a1.getSubmittedAt() == null) return 1;
            return a2.getSubmittedAt().compareTo(a1.getSubmittedAt());
        });

        List<Attempt> graded = attempts; // Tất cả đã là GRADED rồi

        long passed = graded.stream().filter(a -> Boolean.TRUE.equals(a.getPassed())).count();
        Double avg  = graded.stream().filter(a -> a.getScore() != null)
                .mapToDouble(Attempt::getScore).average().isPresent()
                ? Math.round(graded.stream().filter(a -> a.getScore() != null)
                .mapToDouble(Attempt::getScore).average().getAsDouble() * 10.0) / 10.0
                : null;

        List<DashboardResponse.RecentAttempt> recent = attempts.stream()
                .limit(5)
                .map(this::toRecentAttempt)
                .collect(Collectors.toList());

        // ── Monthly Attempts Chart (6 tháng gần nhất) - dùng ALL attempts ──
        List<DashboardResponse.MonthlyAttempt> monthlyAttempts = calculateMonthlyAttempts(allAttempts);

        // ── Score Distribution Chart - dùng best attempts ──
        DashboardResponse.ScoreDistribution scoreDistribution = calculateScoreDistribution(graded);

        return DashboardResponse.Student.builder()
                .enrolledCourses(courses.size())
                .availableExams(exams.size())
                .completedAttempts(attempts.size()) // Số bài thi đã hoàn thành (unique exams)
                .passedAttempts(passed)
                .avgScore(avg)
                .recentAttempts(recent)
                .monthlyAttempts(monthlyAttempts)
                .scoreDistribution(scoreDistribution)
                .build();
    }

    // ── Helper ────────────────────────────────────────────
    private DashboardResponse.RecentAttempt toRecentAttempt(Attempt a) {
        return DashboardResponse.RecentAttempt.builder()
                .attemptId(a.getId())
                .examTitle(a.getExam() != null ? a.getExam().getTitle() : "—")
                .courseName(a.getExam() != null && a.getExam().getCourse() != null
                        ? a.getExam().getCourse().getName() : "—")
                .studentName(a.getStudent() != null ? a.getStudent().getFullName() : "—")
                .score(a.getScore())
                .totalScore(a.getTotalScore())
                .passed(a.getPassed())
                .status(a.getStatus() != null ? a.getStatus().name() : "")
                .submittedAt(a.getSubmittedAt() != null ? a.getSubmittedAt().format(FMT) : null)
                .build();
    }
}