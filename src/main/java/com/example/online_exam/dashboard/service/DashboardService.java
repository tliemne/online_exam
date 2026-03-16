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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
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
                .build();
    }

    // ── TEACHER ───────────────────────────────────────────
    public DashboardResponse.Teacher teacherStats() {
        User teacher = currentUserService.requireCurrentUser();

        List<Course> courses = courseRepo.findByTeacherId(teacher.getId());
        List<Exam>   exams   = examRepo.findByCreatedById(teacher.getId());

        long publishedExams = exams.stream()
                .filter(e -> e.getStatus() == ExamStatus.PUBLISHED).count();

        // Gom tất cả attempt của đề mình tạo
        List<Long> examIds = exams.stream().map(Exam::getId).collect(Collectors.toList());
        List<Attempt> myAttempts = attemptRepo.findAll().stream()
                .filter(a -> examIds.contains(a.getExam().getId()))
                .collect(Collectors.toList());

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
            List<Attempt> cAttempts = myAttempts.stream()
                    .filter(a -> cExamIds.contains(a.getExam().getId()))
                    .collect(Collectors.toList());
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

        return DashboardResponse.Teacher.builder()
                .myCourses(courses.size())
                .myExams(exams.size())
                .publishedExams(publishedExams)
                .pendingGrading(pending)
                .totalAttempts(myAttempts.size())
                .avgScore(Math.round(avg * 10.0) / 10.0)
                .passRate(passRate)
                .courseStats(courseStats)
                .build();
    }

    // ── STUDENT ───────────────────────────────────────────
    public DashboardResponse.Student studentStats() {
        User student = currentUserService.requireCurrentUser();

        List<Course>  courses  = courseRepo.findByStudents_Id(student.getId());
        List<Exam>    exams    = examRepo.findPublishedForStudent(student.getId());
        List<Attempt> attempts = attemptRepo.findSubmittedByStudent(student.getId());

        List<Attempt> graded = attempts.stream()
                .filter(a -> a.getStatus() == AttemptStatus.GRADED).collect(Collectors.toList());

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

        return DashboardResponse.Student.builder()
                .enrolledCourses(courses.size())
                .availableExams(exams.size())
                .completedAttempts(attempts.size())
                .passedAttempts(passed)
                .avgScore(avg)
                .recentAttempts(recent)
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