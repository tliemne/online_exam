package com.example.online_exam.exam.service;

import com.example.online_exam.activitylog.entity.ActivityLogAction;
import com.example.online_exam.activitylog.service.ActivityLogService;
import com.example.online_exam.course.entity.Course;
import com.example.online_exam.course.repository.CourseRepository;
import com.example.online_exam.exam.dto.*;
import com.example.online_exam.exam.entity.Exam;
import com.example.online_exam.exam.entity.ExamQuestion;
import com.example.online_exam.exam.enums.ExamStatus;
import com.example.online_exam.exam.repository.ExamQuestionRepository;
import com.example.online_exam.attempt.repository.AttemptRepository;
import com.example.online_exam.exam.repository.ExamRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.question.entity.Question;
import com.example.online_exam.question.repository.QuestionRepository;
import com.example.online_exam.notification.service.NotificationService;
import com.example.online_exam.common.service.EmailService;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.tag.repository.TagRepository;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.enums.RoleName;
import com.example.online_exam.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.*;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ExamServiceImpl implements ExamService {

    private final ExamRepository         examRepo;
    private final ExamQuestionRepository examQRepo;
    private final CourseRepository       courseRepo;
    private final QuestionRepository     questionRepo;
    private final TagRepository tagRepository;
    private final NotificationService    notificationService;
    private final UserRepository         userRepo;
    private final CurrentUserService     currentUserService;
    private final AttemptRepository      attemptRepo;
    private final EmailService           emailService;
    private final ActivityLogService     activityLogService;
    private final ExamCacheService       examCacheService;

    // ── Create ────────────────────────────────────────────
    @Override
    public ExamResponse create(ExamRequest req) {
        Course course = courseRepo.findById(req.getCourseId())
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        User creator = currentUser();

        if (isTeacher(creator) && !isOwnerOfCourse(course, creator)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Exam exam = new Exam();
        mapRequest(req, exam);
        exam.setCourse(course);
        exam.setCreatedBy(creator);
        exam = examRepo.save(exam);

        if (req.getQuestions() != null && !req.getQuestions().isEmpty()) {
            addQuestionsToExam(exam, req.getQuestions());
        }

        ExamResponse resp = toResponse(examRepo.findById(exam.getId()).orElseThrow(), true, false);
        activityLogService.logUser(creator, ActivityLogAction.CREATE_EXAM,
                "EXAM", exam.getId(), "Tạo đề thi: " + exam.getTitle());
        return resp;
    }

    // ── Update ────────────────────────────────────────────
    @Override
    public ExamResponse update(Long id, ExamRequest req) {
        Exam exam = findExam(id);
        User caller = currentUser();

        if (isTeacher(caller)) checkOwnership(exam, caller);

        if (exam.getStatus() == ExamStatus.PUBLISHED) {
            boolean stillActive = exam.getEndTime() == null
                    || exam.getEndTime().isAfter(java.time.LocalDateTime.now());
            if (stillActive && isTeacher(caller)) {
                throw new AppException(ErrorCode.INVALID_REQUEST);
            }
        }

        if (req.getCourseId() != null && !req.getCourseId().equals(exam.getCourse().getId())) {
            Course course = courseRepo.findById(req.getCourseId())
                    .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
            if (isTeacher(caller) && !isOwnerOfCourse(course, caller)) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
            exam.setCourse(course);
        }

        mapRequest(req, exam);
        ExamResponse resp = toResponse(examRepo.save(exam), true, false);
        examCacheService.evict(id);
        activityLogService.logUser(caller, ActivityLogAction.UPDATE_EXAM,
                "EXAM", id, "Cập nhật đề thi: " + exam.getTitle());
        return resp;
    }

    // ── Delete ────────────────────────────────────────────
    @Override
    public void delete(Long id) {
        Exam exam = findExam(id);
        User caller = currentUser();

        if (isTeacher(caller)) checkOwnership(exam, caller);

        if (exam.getStatus() == ExamStatus.PUBLISHED) {
            boolean expired = exam.getEndTime() != null
                    && exam.getEndTime().isBefore(java.time.LocalDateTime.now());
            if (!expired) throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        String title = exam.getTitle();
        examRepo.delete(exam);
        examCacheService.evict(id);
        activityLogService.logUser(caller, ActivityLogAction.DELETE_EXAM,
                "EXAM", id, "Xóa đề thi: " + title);
    }

    // ── Get ───────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public ExamResponse getById(Long id, boolean includeQuestions, boolean hideCorrect) {
        // Cache chỉ khi cần questions (student lấy đề thi để làm bài)
        if (includeQuestions && hideCorrect) {
            Optional<ExamResponse> cached = examCacheService.get(id);
            if (cached.isPresent()) return cached.get();
        }
        Exam exam = findExam(id);
        User caller = currentUser();
        if (isTeacher(caller)) checkOwnership(exam, caller);
        ExamResponse response = toResponse(exam, includeQuestions, hideCorrect);
        if (includeQuestions && hideCorrect) {
            examCacheService.put(id, response);
        }
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamResponse> getAll() {
        User caller = currentUser();
        if (isTeacher(caller)) {
            // GV thấy: đề mình tạo + đề trong lớp mình phụ trách
            Set<Long> seen = new HashSet<>();
            List<Exam> result = new ArrayList<>();
            // Đề mình tạo
            examRepo.findByCreatedById(caller.getId()).forEach(e -> {
                if (seen.add(e.getId())) result.add(e);
            });
            // Đề trong lớp mình phụ trách (admin có thể tạo)
            examRepo.findByCourseTeacherId(caller.getId()).forEach(e -> {
                if (seen.add(e.getId())) result.add(e);
            });
            return result.stream()
                    .map(e -> toResponse(e, false, false)).collect(Collectors.toList());
        }
        return examRepo.findAll().stream()
                .map(e -> toResponse(e, false, false)).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamResponse> getByCourse(Long courseId) {
        User caller = currentUser();
        if (isTeacher(caller)) {
            // GV thấy đề trong lớp mình phụ trách (kể cả đề do admin tạo)
            Course course = courseRepo.findById(courseId).orElse(null);
            boolean isCourseTeacher = course != null
                    && course.getTeacher() != null
                    && course.getTeacher().getId().equals(caller.getId());
            if (!isCourseTeacher) {
                // GV không phụ trách lớp này → chỉ thấy đề mình tạo
                return examRepo.findByCourseId(courseId).stream()
                        .filter(e -> e.getCreatedBy() != null && e.getCreatedBy().getId().equals(caller.getId()))
                        .map(e -> toResponse(e, false, false)).collect(Collectors.toList());
            }
            // GV phụ trách lớp → thấy tất cả đề của lớp
            return examRepo.findByCourseId(courseId).stream()
                    .map(e -> toResponse(e, false, false)).collect(Collectors.toList());
        }
        return examRepo.findByCourseId(courseId).stream()
                .map(e -> toResponse(e, false, false)).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamResponse> getForStudent(Long studentId) {
        return examRepo.findPublishedForStudent(studentId).stream()
                .map(e -> {
                    ExamResponse r = toResponse(e, false, false);
                    long cnt = attemptRepo.countByExamIdAndStudentId(e.getId(), studentId);
                    r.setMyAttemptCount((int) cnt);
                    return r;
                }).collect(Collectors.toList());
    }

    // ── Manage questions ──────────────────────────────────
    @Override
    public ExamResponse addQuestion(Long examId, ExamQuestionItem item) {
        return addQuestions(examId, List.of(item));
    }

    @Override
    public ExamResponse addQuestions(Long examId, List<ExamQuestionItem> items) {
        Exam exam = findExam(examId);
        User caller = currentUser();
        if (isTeacher(caller)) checkOwnership(exam, caller);
        addQuestionsToExam(exam, items);
        examCacheService.evict(examId);
        return toResponse(examRepo.findById(examId).orElseThrow(), true, false);
    }

    @Override
    public ExamResponse removeQuestion(Long examId, Long questionId) {
        Exam exam = findExam(examId);
        User caller = currentUser();
        if (isTeacher(caller)) checkOwnership(exam, caller);
        examQRepo.deleteByExamIdAndQuestionId(examId, questionId);
        examCacheService.evict(examId);
        return toResponse(findExam(examId), true, false);
    }

    @Override
    public ExamResponse updateQuestionScore(Long examId, Long questionId, Double score) {
        Exam exam = findExam(examId);
        User caller = currentUser();
        if (isTeacher(caller)) checkOwnership(exam, caller);
        
        ExamQuestion eq = examQRepo.findByExamIdAndQuestionId(examId, questionId)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));
        eq.setScore(score != null ? score : 1.0);
        examQRepo.save(eq);
        
        examCacheService.evict(examId);
        return toResponse(findExam(examId), true, false);
    }

    @Override
    public ExamResponse reorderQuestions(Long examId, List<ExamQuestionItem> items) {
        Exam exam = findExam(examId);
        User caller = currentUser();
        if (isTeacher(caller)) checkOwnership(exam, caller);
        List<ExamQuestion> eqs = examQRepo.findByExamIdOrderByOrderIndex(examId);
        for (ExamQuestionItem item : items) {
            eqs.stream()
                    .filter(eq -> eq.getQuestion().getId().equals(item.getQuestionId()))
                    .findFirst()
                    .ifPresent(eq -> {
                        eq.setOrderIndex(item.getOrderIndex());
                        if (item.getScore() != null) eq.setScore(item.getScore());
                    });
        }
        examQRepo.saveAll(eqs);
        examCacheService.evict(examId);
        return toResponse(findExam(examId), true, false);
    }

    // ── Publish / Close ───────────────────────────────────
    @Override
    public ExamResponse publish(Long id) {
        Exam exam = findExam(id);
        User caller = currentUser();
        if (isTeacher(caller)) checkOwnership(exam, caller);

        if (exam.getExamQuestions().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        exam.setStatus(ExamStatus.PUBLISHED);
        ExamResponse response = toResponse(examRepo.save(exam), false, false);

        activityLogService.logUser(caller, ActivityLogAction.PUBLISH_EXAM,
                "EXAM", id, "Publish đề thi: " + exam.getTitle());

        if (exam.getCourse() != null && exam.getCourse().getStudents() != null) {
            String courseName = exam.getCourse().getName();
            String examLink   = "/student/exams";
            exam.getCourse().getStudents().forEach(student -> {
                if (student.getEmail() != null) {
                    emailService.sendExamPublished(
                            student.getEmail(), student.getFullName(),
                            exam.getTitle(), courseName,
                            exam.getStartTime(), exam.getEndTime(),
                            exam.getDurationMinutes());
                }
                notificationService.examPublished(student, exam.getTitle(), examLink);
            });
        }
        return response;
    }

    @Override
    public ExamResponse close(Long id) {
        Exam exam = findExam(id);
        User caller = currentUser();
        if (isTeacher(caller)) checkOwnership(exam, caller);

        exam.setStatus(ExamStatus.CLOSED);
        ExamResponse resp = toResponse(examRepo.save(exam), false, false);
        activityLogService.logUser(caller, ActivityLogAction.CLOSE_EXAM,
                "EXAM", id, "Đóng đề thi: " + exam.getTitle());
        return resp;
    }

    // ── Helpers ───────────────────────────────────────────
    
    private void checkOwnership(Exam exam, User caller) {
        // Cho phép: người tạo đề HOẶC giáo viên phụ trách lớp chứa đề
        boolean isCreator = exam.getCreatedBy() != null
                && exam.getCreatedBy().getId().equals(caller.getId());
        boolean isCourseTeacher = exam.getCourse() != null
                && exam.getCourse().getTeacher() != null
                && exam.getCourse().getTeacher().getId().equals(caller.getId());
        if (!isCreator && !isCourseTeacher)
            throw new AppException(ErrorCode.FORBIDDEN);
    }

    private boolean isOwnerOfCourse(Course course, User caller) {
        return course.getTeacher() != null && course.getTeacher().getId().equals(caller.getId());
    }

    private boolean isTeacher(User user) {
        return user.getRoles().stream().anyMatch(r -> r.getName() == RoleName.TEACHER);
    }

    private void mapRequest(ExamRequest req, Exam exam) {
        if (req.getTitle() != null)           exam.setTitle(req.getTitle());
        if (req.getDescription() != null)     exam.setDescription(req.getDescription());
        if (req.getDurationMinutes() != null) exam.setDurationMinutes(req.getDurationMinutes());
        if (req.getStartTime() != null)       exam.setStartTime(req.getStartTime());
        if (req.getEndTime() != null)         exam.setEndTime(req.getEndTime());
        exam.setTotalScore(req.getTotalScore() != null ? req.getTotalScore() : 10.0);
        exam.setPassScore(req.getPassScore() != null ? req.getPassScore() : 5.0);
        exam.setRandomizeQuestions(req.getRandomizeQuestions() != null && req.getRandomizeQuestions());
        exam.setMaxAttempts(req.getMaxAttempts() != null ? req.getMaxAttempts() : 1);
        exam.setAllowResume(req.getAllowResume() != null ? req.getAllowResume() : false);
    }

    @Override
    public ExamResponse randomQuestions(Long examId, RandomQuestionRequest request) {
        Exam exam = findExam(examId);
        User caller = currentUser();
        if (isTeacher(caller)) checkOwnership(exam, caller);

        Long courseId = exam.getCourse().getId();

        // Xóa câu cũ nếu yêu cầu
        if (request.isReplaceExisting()) {
            examQRepo.deleteByExamId(examId);
        }

        // ID câu đã có trong đề (để tránh trùng)
        Set<Long> existingIds = examQRepo.findByExamIdOrderByOrderIndex(examId)
                .stream().map(eq -> eq.getQuestion().getId()).collect(Collectors.toSet());

        List<ExamQuestion> toAdd = new ArrayList<>();
        int orderIndex = examQRepo.findByExamIdOrderByOrderIndex(examId).size();

        for (RandomQuestionRequest.RandomRule rule : request.getRules()) {
            if (rule.getTagId() == null || rule.getCount() <= 0) continue;

            // Lấy nhiều hơn cần để trừ đi câu đã có
            int fetchSize = rule.getCount() + existingIds.size() + 5;
            List<Question> candidates = questionRepo.findRandomByTag(
                    courseId, rule.getTagId(), rule.getDifficulty(),
                    PageRequest.of(0, fetchSize)
            );

            int added = 0;
            for (Question q : candidates) {
                if (added >= rule.getCount()) break;
                if (existingIds.contains(q.getId())) continue;

                ExamQuestion eq = new ExamQuestion();
                eq.setExam(exam);
                eq.setQuestion(q);
                eq.setScore(rule.getScore() != null ? rule.getScore() : 1.0);
                eq.setOrderIndex(++orderIndex);
                toAdd.add(eq);
                existingIds.add(q.getId());
                added++;
            }
        }

        examQRepo.saveAll(toAdd);
        return toResponse(examRepo.findById(examId).orElseThrow(), true, false);
    }

    private void addQuestionsToExam(Exam exam, List<ExamQuestionItem> items) {
        int currentMax = exam.getExamQuestions().size();
        List<ExamQuestion> toAdd = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            ExamQuestionItem item = items.get(i);
            if (examQRepo.existsByExamIdAndQuestionId(exam.getId(), item.getQuestionId())) continue;
            Question q = questionRepo.findById(item.getQuestionId())
                    .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));
            ExamQuestion eq = new ExamQuestion();
            eq.setExam(exam); eq.setQuestion(q);
            // Điểm mặc định = 1.0, sẽ tính lại khi submit
            eq.setScore(item.getScore() != null ? item.getScore() : 1.0);
            eq.setOrderIndex(item.getOrderIndex() != null ? item.getOrderIndex() : currentMax + i);
            toAdd.add(eq);
        }
        examQRepo.saveAll(toAdd);
    }

    private ExamResponse toResponse(Exam exam, boolean includeQuestions, boolean hideCorrect) {
        ExamResponse r = new ExamResponse();
        r.setId(exam.getId()); r.setTitle(exam.getTitle());
        r.setDescription(exam.getDescription());
        r.setDurationMinutes(exam.getDurationMinutes());
        r.setStartTime(exam.getStartTime()); r.setEndTime(exam.getEndTime());
        r.setTotalScore(exam.getTotalScore()); r.setPassScore(exam.getPassScore());
        r.setRandomizeQuestions(exam.getRandomizeQuestions());
        r.setMaxAttempts(exam.getMaxAttempts());
        r.setAllowResume(exam.getAllowResume() != null ? exam.getAllowResume() : false);
        r.setMaxTabViolations(exam.getMaxTabViolations() != null ? exam.getMaxTabViolations() : 3);
        r.setMaxExitAttempts(exam.getMaxExitAttempts() != null ? exam.getMaxExitAttempts() : 1);
        r.setStatus(exam.getStatus()); r.setCreatedAt(exam.getCreatedAt());
        if (exam.getCourse() != null) {
            r.setCourseId(exam.getCourse().getId());
            r.setCourseName(exam.getCourse().getName());
        }
        if (exam.getCreatedBy() != null) r.setCreatedByName(exam.getCreatedBy().getFullName());
        r.setQuestionCount(exam.getExamQuestions().size());
        
        log.info("toResponse: examId={}, includeQuestions={}, questionCount={}, status={}", 
                exam.getId(), includeQuestions, exam.getExamQuestions().size(), exam.getStatus());
        
        if (includeQuestions) {
            r.setQuestions(exam.getExamQuestions().stream()
                    .map(eq -> toExamQResponse(eq, hideCorrect)).collect(Collectors.toList()));
            log.info("toResponse: returning {} questions", r.getQuestions().size());
        }
        return r;
    }

    private ExamQuestionResponse toExamQResponse(ExamQuestion eq, boolean hideCorrect) {
        Question q = eq.getQuestion();
        ExamQuestionResponse r = new ExamQuestionResponse();
        r.setId(eq.getId()); r.setQuestionId(q.getId());
        r.setContent(q.getContent()); r.setType(q.getType()); r.setDifficulty(q.getDifficulty());
        r.setScore(eq.getScore()); r.setOrderIndex(eq.getOrderIndex());
        r.setAnswers(q.getAnswers().stream().map(a -> {
            ExamQuestionResponse.AnswerInExam ai = new ExamQuestionResponse.AnswerInExam();
            ai.setId(a.getId()); ai.setContent(a.getContent());
            ai.setCorrect(hideCorrect ? null : a.isCorrect());
            return ai;
        }).collect(Collectors.toList()));
        return r;
    }

    private Exam findExam(Long id) {
        return examRepo.findById(id).orElseThrow(() -> new AppException(ErrorCode.EXAM_NOT_FOUND));
    }

    private User currentUser() { return currentUserService.requireCurrentUser(); }
}