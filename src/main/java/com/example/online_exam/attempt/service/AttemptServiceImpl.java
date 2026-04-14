package com.example.online_exam.attempt.service;

import com.example.online_exam.attempt.dto.*;
import com.example.online_exam.attempt.entity.*;
import com.example.online_exam.attempt.enums.AttemptStatus;
import com.example.online_exam.attempt.repository.*;
import com.example.online_exam.exam.entity.Exam;
import com.example.online_exam.exam.entity.ExamQuestion;
import com.example.online_exam.exam.repository.ExamRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.question.entity.Answer;
import com.example.online_exam.question.entity.Question;
import com.example.online_exam.question.enums.QuestionType;
import com.example.online_exam.question.repository.QuestionRepository;
import com.example.online_exam.question.service.QuestionStatService;
import com.example.online_exam.notification.service.NotificationService;
import com.example.online_exam.common.service.EmailService;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.enums.RoleName;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AttemptServiceImpl implements AttemptService {

    private final AttemptRepository       attemptRepo;
    private final AttemptAnswerRepository answerRepo;

    @PersistenceContext
    private EntityManager em;
    private final ExamRepository          examRepo;
    private final QuestionRepository      questionRepo;
    private final CurrentUserService      currentUserService;
    private final EmailService            emailService;
    private final QuestionStatService     questionStatService;
    private final NotificationService     notificationService;

    // ── Start Exam → tạo attempt IN_PROGRESS (hoặc trả lại nếu đã có) ─────
    @Override
    public AttemptResponse startExam(Long examId) {
        User student = currentUserService.requireCurrentUser();
        Exam exam    = examRepo.findById(examId)
                .orElseThrow(() -> new AppException(ErrorCode.EXAM_NOT_FOUND));

        // Đã có attempt đang dở → resume, không tạo mới
        // Dùng List để tránh lỗi khi có nhiều IN_PROGRESS (duplicate)
        List<Attempt> inProgressList = attemptRepo.findAllByExamIdAndStudentIdAndStatus(
                examId, student.getId(), AttemptStatus.IN_PROGRESS);

        if (!inProgressList.isEmpty()) {
            boolean allowResume = Boolean.TRUE.equals(exam.getAllowResume());
            log.info("startExam: examId={}, studentId={}, allowResume={}, inProgressCount={}",
                    examId, student.getId(), allowResume, inProgressList.size());

            if (!allowResume) {
                // Reset: xóa bằng native query tránh optimistic lock conflict
                List<Long> ids = inProgressList.stream()
                        .map(Attempt::getId).collect(Collectors.toList());
                attemptRepo.deleteAllByIdInBatch(ids);
                attemptRepo.flush();
            } else {
                // Resume: giữ cái mới nhất
                Attempt latest = inProgressList.get(0);
                if (inProgressList.size() > 1) {
                    List<Long> dupIds = inProgressList.subList(1, inProgressList.size())
                            .stream().map(Attempt::getId).collect(Collectors.toList());
                    attemptRepo.deleteAllByIdInBatch(dupIds);
                    attemptRepo.flush();
                }
                Attempt ex = attemptRepo.findByIdWithExam(latest.getId()).orElse(latest);
                // findByIdWithAnswers (không fetch q.answers) đủ để restore câu trả lời
                attemptRepo.findByIdWithAnswers(ex.getId()).ifPresent(a -> ex.setAnswers(a.getAnswers()));
                return toResponse(ex, true);
            }
        }

        // Kiểm tra số lần thi
        long doneCount = attemptRepo.countByExamIdAndStudentId(examId, student.getId());
        if (exam.getMaxAttempts() != null && doneCount >= exam.getMaxAttempts()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        Attempt attempt = new Attempt();
        attempt.setExam(exam);
        attempt.setStudent(student);
        attempt.setStatus(AttemptStatus.IN_PROGRESS);
        attempt.setTotalScore(exam.getTotalScore() != null ? exam.getTotalScore() : 10.0);
        attempt.setTabViolationCount(0);
        attempt.setTimeRemainingSeconds(exam.getDurationMinutes() != null
                ? exam.getDurationMinutes() * 60 : 3600);
        
        // Xáo trộn câu hỏi nếu exam có randomizeQuestions = true
        if (Boolean.TRUE.equals(exam.getRandomizeQuestions())) {
            attempt.setQuestionOrder(generateRandomizedQuestionOrder(examId));
        }
        
        Attempt saved = attemptRepo.save(attempt);
        // Fetch lại với exam để tránh LazyInitializationException
        return toResponse(attemptRepo.findByIdWithExam(saved.getId()).orElse(saved), false);
    }

    // ── Submit by attemptId ────────────────────────────────────────────────
    @Override
    public AttemptResponse submitAttempt(Long attemptId, List<SubmitAnswerItem> items) {
        Attempt attempt = findAttempt(attemptId);
        User student = attempt.getStudent();
        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS)
            throw new AppException(ErrorCode.ALREADY_SUBMITTED);
        return doSubmit(attempt, items, student);
    }

    // ── Submit legacy (tạo attempt + submit luôn — tương thích cũ) ────────
    @Override
    public AttemptResponse submit(Long examId, List<SubmitAnswerItem> items) {
        AttemptResponse started = startExam(examId);
        return submitAttempt(started.getId(), items);
    }

    // ── Submit core ────────────────────────────────────────────────────────
    private AttemptResponse doSubmit(Attempt attempt, List<SubmitAnswerItem> items, User student) {
        Long attemptId = attempt.getId();

        // Bước 1: Xóa answers cũ bằng native DELETE
        answerRepo.deleteByAttemptId(attemptId);

        // Bước 2: Load lại attempt FRESH từ DB
        attempt = attemptRepo.findByIdWithExam(attemptId)
                .orElseThrow(() -> new AppException(ErrorCode.ATTEMPT_NOT_FOUND));

        // Lấy student từ attempt mới — tránh dùng proxy cũ đã detached
        student = attempt.getStudent();
        final Long studentId = student.getId();

        Exam exam = attempt.getExam();
        Map<Long, ExamQuestion> examQMap = exam.getExamQuestions().stream()
                .collect(Collectors.toMap(eq -> eq.getQuestion().getId(), eq -> eq));

        List<AttemptAnswer> savedAnswers = new ArrayList<>();
        double totalEarned = 0.0;
        boolean hasEssay   = false;

        for (SubmitAnswerItem item : items) {
            Question q = questionRepo.findById(item.getQuestionId()).orElse(null);
            if (q == null) continue;

            AttemptAnswer aa = new AttemptAnswer();
            aa.setAttempt(attempt);
            aa.setQuestion(q);

            ExamQuestion eq = examQMap.get(q.getId());
            double qScore   = eq != null ? (eq.getScore() != null ? eq.getScore() : 1.0) : 1.0;

            if (q.getType().name().equals("ESSAY")) {
                aa.setTextAnswer(item.getTextAnswer());
                aa.setIsCorrect(null);
                aa.setScore(null);
                hasEssay = true;
            } else {
                Answer selected = null;
                if (item.getAnswerId() != null) {
                    selected = q.getAnswers().stream()
                            .filter(a -> a.getId().equals(item.getAnswerId()))
                            .findFirst().orElse(null);
                } else if ("true".equals(item.getTextAnswer()) || "false".equals(item.getTextAnswer())) {
                    boolean chosenTrue = "true".equals(item.getTextAnswer());
                    selected = q.getAnswers().stream()
                            .filter(a -> a.isCorrect() == chosenTrue)
                            .findFirst().orElse(null);
                }
                if (selected != null) {
                    aa.setSelectedAnswer(selected);
                    boolean correct = selected.isCorrect();
                    aa.setIsCorrect(correct);
                    aa.setScore(correct ? qScore : 0.0);
                    if (correct) totalEarned += qScore;
                    log.info("[Submit] Q={} answerId={} correct={}", item.getQuestionId(), item.getAnswerId(), correct);
                } else {
                    aa.setIsCorrect(false);
                    aa.setScore(0.0);
                    log.warn("[Submit] Q={} answerId={} NOT FOUND - set is_correct=false", item.getQuestionId(), item.getAnswerId());
                }
            }
            savedAnswers.add(aa);
        }

        answerRepo.saveAll(savedAnswers);
        attempt.setSubmittedAt(LocalDateTime.now());
        attempt.setStatus(AttemptStatus.SUBMITTED);

        boolean autoGraded = false;
        if (!hasEssay) {
            double maxEarnable = exam.getExamQuestions().stream()
                    .mapToDouble(eq -> eq.getScore() != null ? eq.getScore() : 1.0).sum();
            double finalScore = maxEarnable > 0
                    ? Math.round((totalEarned / maxEarnable) * attempt.getTotalScore() * 10.0) / 10.0
                    : 0.0;
            attempt.setScore(finalScore);
            attempt.setPassed(exam.getPassScore() == null || finalScore >= exam.getPassScore());
            attempt.setStatus(AttemptStatus.GRADED);
            autoGraded = true;
        }

        attempt = attemptRepo.save(attempt);

        if (autoGraded && student.getEmail() != null) {
            emailService.sendGradeResult(
                    student.getEmail(), student.getFullName(),
                    exam.getTitle(),
                    exam.getCourse() != null ? exam.getCourse().getName() : null,
                    attempt.getScore(), attempt.getTotalScore(), attempt.getPassed());
        }

        if (autoGraded) {
            notificationService.attemptGraded(student, exam.getTitle(),
                    attempt.getScore(), attempt.getTotalScore());
        }

        // Thông báo cho teacher khi có bài tự luận cần chấm
        if (hasEssay) {
            Set<User> notifyTeachers = new HashSet<>();
            if (exam.getCreatedBy() != null) {
                notifyTeachers.add(exam.getCreatedBy());
            }
            if (exam.getCourse() != null && exam.getCourse().getTeacher() != null) {
                notifyTeachers.add(exam.getCourse().getTeacher());
            }
            for (User teacher : notifyTeachers) {
                notificationService.essayPendingGrade(
                        teacher, exam.getTitle(), student.getFullName());
            }
        }

        // ✅ Cập nhật stats ASYNC (sau khi transaction commit)
        // Chỉ cập nhật stats cho câu TRẮC NGHIỆM khi nộp bài (vì tự luận chưa chấm)
        Map<Long, Boolean> statMap = savedAnswers.stream()
                .filter(aa -> aa.getQuestion() != null && aa.getIsCorrect() != null)
                .filter(aa -> aa.getQuestion().getType() != QuestionType.ESSAY) // Chỉ trắc nghiệm
                .collect(java.util.stream.Collectors.toMap(
                        aa -> aa.getQuestion().getId(),
                        AttemptAnswer::getIsCorrect,
                        (a, b) -> a
                ));
        log.info("[Attempt] ===== SUBMIT STATS UPDATE =====");
        log.info("[Attempt] Total answers saved: {}", savedAnswers.size());
        for (AttemptAnswer aa : savedAnswers) {
            log.info("[Attempt]   Q={} isCorrect={} type={}", 
                aa.getQuestion().getId(), aa.getIsCorrect(), aa.getQuestion().getType());
        }
        log.info("[Attempt] Extracted {} questions for stat update (MULTIPLE_CHOICE/TRUE_FALSE only)", statMap.size());
        if (!statMap.isEmpty()) {
            log.info("[Attempt] Calling updateStatsById with map: {}", statMap);
            questionStatService.updateStatsById(statMap);
        } else {
            log.warn("[Attempt] ❌ statMap is EMPTY - no stats to update (all questions are ESSAY)");
        }
        log.info("[Attempt] ===== END SUBMIT STATS UPDATE =====");

        return toResponse(attempt, false);
    }

    // ── Get by ID ──────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public AttemptResponse getById(Long attemptId) {
        return toResponse(findAttempt(attemptId), true);
    }

    // ── Student views ──────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public List<AttemptResponse> getMyAttempts() {
        User student = currentUserService.requireCurrentUser();
        return attemptRepo.findSubmittedByStudent(student.getId())
                .stream().map(a -> toResponse(a, false)).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttemptResponse> getMyAttemptsByExam(Long examId) {
        User student = currentUserService.requireCurrentUser();
        return attemptRepo.findByExamIdAndStudentIdOrderByStartedAtDesc(examId, student.getId())
                .stream().map(a -> toResponse(a, false)).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AttemptResponse getMyInProgress(Long examId) {
        User student = currentUserService.requireCurrentUser();
        List<Attempt> list = attemptRepo.findAllByExamIdAndStudentIdAndStatus(
                examId, student.getId(), AttemptStatus.IN_PROGRESS);
        if (list.isEmpty()) return null;
        return toResponse(list.get(0), true);
    }

    // ── Teacher view ───────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public List<AttemptResponse> getByExam(Long examId) {
        User caller = currentUserService.requireCurrentUser();
        Exam exam = examRepo.findById(examId)
                .orElseThrow(() -> new AppException(ErrorCode.EXAM_NOT_FOUND));
        if (isTeacher(caller)) checkExamOwnership(exam, caller);
        return attemptRepo.findByExamIdOrderBySubmittedAtDesc(examId)
                .stream().map(a -> toResponse(a, false)).collect(Collectors.toList());
    }

    // ── Grade (tự luận) ────────────────────────────────────────────────────
    @Override
    public AttemptResponse grade(Long attemptId, GradeRequest req) {
        AttemptResponse response = gradeAndSave(attemptId, req);
        if (response.getStudentEmail() != null) {
            emailService.sendGradeResult(
                    response.getStudentEmail(), response.getStudentName(),
                    response.getExamTitle(), response.getCourseName(),
                    response.getScore(), response.getTotalScore(), response.getPassed());
        }
        // Thông báo cho student khi tự luận được chấm
        findAttempt(attemptId).getStudent();
        Attempt graded = findAttempt(attemptId);
        notificationService.essayGraded(graded.getStudent(), response.getExamTitle());
        return response;
    }

    @Transactional
    public AttemptResponse gradeAndSave(Long attemptId, GradeRequest req) {
        Attempt attempt = findAttempt(attemptId);
        User caller = currentUserService.requireCurrentUser();
        if (isTeacher(caller)) checkExamOwnership(attempt.getExam(), caller);

        for (GradeRequest.AnswerGrade ag : req.getAnswers()) {
            attempt.getAnswers().stream()
                    .filter(aa -> aa.getId().equals(ag.getAttemptAnswerId()))
                    .findFirst().ifPresent(aa -> {
                        if (ag.getScore()          != null) aa.setScore(ag.getScore());
                        if (ag.getIsCorrect()      != null) aa.setIsCorrect(ag.getIsCorrect());
                        if (ag.getTeacherComment() != null) aa.setTeacherComment(ag.getTeacherComment());
                    });
        }

        double total       = attempt.getAnswers().stream()
                .mapToDouble(aa -> aa.getScore() != null ? aa.getScore() : 0.0).sum();
        double maxScore    = attempt.getTotalScore() != null ? attempt.getTotalScore() : 10.0;
        double maxEarnable = attempt.getExam().getExamQuestions().stream()
                .mapToDouble(eq -> eq.getScore() != null ? eq.getScore() : 1.0).sum();
        double finalScore  = maxEarnable > 0
                ? Math.round((total / maxEarnable) * maxScore * 10.0) / 10.0 : 0.0;

        attempt.setScore(finalScore);
        attempt.setPassed(attempt.getExam().getPassScore() == null
                || finalScore >= attempt.getExam().getPassScore());
        attempt.setStatus(AttemptStatus.GRADED);
        
        attemptRepo.save(attempt);
        
        // ✅ Cập nhật stats ASYNC khi teacher grade tự luận
        // Chỉ cập nhật stats cho câu TỰ LUẬN (vì trắc nghiệm đã cập nhật khi nộp)
        Map<Long, Boolean> statMap = attempt.getAnswers().stream()
                .filter(aa -> aa.getQuestion() != null && aa.getIsCorrect() != null)
                .filter(aa -> aa.getQuestion().getType() == QuestionType.ESSAY) // Chỉ tự luận
                .collect(java.util.stream.Collectors.toMap(
                        aa -> aa.getQuestion().getId(),
                        AttemptAnswer::getIsCorrect,
                        (a, b) -> a
                ));
        log.info("[Grade] ===== GRADE STATS UPDATE =====");
        log.info("[Grade] Total answers: {}", attempt.getAnswers().size());
        for (AttemptAnswer aa : attempt.getAnswers()) {
            log.info("[Grade]   Q={} isCorrect={} score={} type={}", 
                aa.getQuestion().getId(), aa.getIsCorrect(), aa.getScore(), aa.getQuestion().getType());
        }
        log.info("[Grade] Extracted {} questions for stat update (ESSAY only)", statMap.size());
        if (!statMap.isEmpty()) {
            log.info("[Grade] Calling updateStatsById with map: {}", statMap);
            questionStatService.updateStatsById(statMap);
        } else {
            log.warn("[Grade] ❌ statMap is EMPTY - no ESSAY questions to update");
        }
        log.info("[Grade] ===== END GRADE STATS UPDATE =====");
        
        return toResponse(attempt, true);
    }

    @Override
    @Transactional(readOnly = true)
    public long countPendingByExam(Long examId) {
        return attemptRepo.countPendingByExamId(examId);
    }

    // ── Heartbeat: lưu timer + tab + answers tạm ─────────────────────────
    @Override
    public void heartbeat(Long attemptId, int timeRemainingSeconds, int tabViolationCount,
                          List<SubmitAnswerItem> items) {
        Attempt attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> new AppException(ErrorCode.ATTEMPT_NOT_FOUND));
        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) return;

        attempt.setTimeRemainingSeconds(timeRemainingSeconds);
        attempt.setTabViolationCount(tabViolationCount);
        
        // Kiểm tra nếu vi phạm quá nhiều → tự động submit
        Integer maxViolations = attempt.getExam().getMaxTabViolations() != null 
                ? attempt.getExam().getMaxTabViolations() : 3;
        if (tabViolationCount >= maxViolations) {
            log.info("heartbeat: attemptId={}, tabViolationCount={} >= maxViolations={}, auto-submitting",
                    attemptId, tabViolationCount, maxViolations);
            // Tự động submit bài
            doSubmit(attempt, items, attempt.getStudent());
            return;
        }
        
        attemptRepo.save(attempt);

        // Lưu answers tạm — upsert từng câu đã trả lời
        if (items != null && !items.isEmpty()) {
            List<AttemptAnswer> existing = answerRepo.findByAttemptId(attemptId);
            Map<Long, AttemptAnswer> existingMap = new java.util.HashMap<>();
            existing.forEach(aa -> {
                if (aa.getQuestion() != null)
                    existingMap.put(aa.getQuestion().getId(), aa);
            });

            List<AttemptAnswer> toSave = new ArrayList<>();
            for (SubmitAnswerItem item : items) {
                Question q = questionRepo.findById(item.getQuestionId()).orElse(null);
                if (q == null) continue;

                AttemptAnswer aa = existingMap.getOrDefault(q.getId(), new AttemptAnswer());
                aa.setAttempt(attempt);
                aa.setQuestion(q);

                if (item.getAnswerId() != null) {
                    q.getAnswers().stream()
                            .filter(a -> a.getId().equals(item.getAnswerId()))
                            .findFirst().ifPresent(aa::setSelectedAnswer);
                    aa.setTextAnswer(null);
                } else {
                    aa.setSelectedAnswer(null);
                    aa.setTextAnswer(item.getTextAnswer());
                }
                toSave.add(aa);
            }
            answerRepo.saveAll(toSave);
        }
    }

    // ── Reset attempt ──────────────────────────────────────────────────────
    @Override
    public void resetAttempt(Long attemptId) {
        Attempt attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> new AppException(ErrorCode.ATTEMPT_NOT_FOUND));
        User caller = currentUserService.requireCurrentUser();
        if (isTeacher(caller)) checkExamOwnership(attempt.getExam(), caller);
        attemptRepo.delete(attempt);
    }

    // ── Exit exam (track exit count) ────────────────────────────────────────
    @Override
    public void exitExam(Long attemptId) {
        Attempt attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> new AppException(ErrorCode.ATTEMPT_NOT_FOUND));
        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) return;

        // Tăng exitCount
        Integer exitCount = attempt.getExitCount() != null ? attempt.getExitCount() : 0;
        attempt.setExitCount(exitCount + 1);
        
        // Kiểm tra nếu vượt quá giới hạn → tự động submit
        Integer maxExits = attempt.getExam().getMaxExitAttempts() != null 
                ? attempt.getExam().getMaxExitAttempts() : 1;
        if (maxExits > 0 && attempt.getExitCount() >= maxExits) {
            log.info("exitExam: attemptId={}, exitCount={} >= maxExitAttempts={}, auto-submitting",
                    attemptId, attempt.getExitCount(), maxExits);
            // Tự động submit bài
            doSubmit(attempt, new ArrayList<>(), attempt.getStudent());
        } else {
            attemptRepo.save(attempt);
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────
    private void checkExamOwnership(Exam exam, User caller) {
        // Cho phép: người tạo đề HOẶC giáo viên phụ trách lớp chứa đề
        boolean isCreator = exam.getCreatedBy() != null
                && exam.getCreatedBy().getId().equals(caller.getId());
        boolean isCourseTeacher = exam.getCourse() != null
                && exam.getCourse().getTeacher() != null
                && exam.getCourse().getTeacher().getId().equals(caller.getId());
        if (!isCreator && !isCourseTeacher)
            throw new AppException(ErrorCode.FORBIDDEN);
    }

    private boolean isTeacher(User user) {
        return user.getRoles().stream().anyMatch(r -> r.getName() == RoleName.TEACHER);
    }

    private Attempt findAttempt(Long id) {
        Attempt attempt = attemptRepo.findByIdWithExam(id)
                .orElseThrow(() -> new AppException(ErrorCode.ATTEMPT_NOT_FOUND));
        // Query 1: fetch attempt.answers (không fetch q.answers — tránh MultipleBagFetchException)
        attemptRepo.findByIdWithAnswers(id)
                .ifPresent(a -> attempt.setAnswers(a.getAnswers()));
        // Query 2: load tất cả question.answers trong 1 query (tránh N+1)
        List<Question> questionsWithOptions =
                attemptRepo.findQuestionsWithAnswersByAttemptId(id);
        Map<Long, Question> qMap = questionsWithOptions.stream()
                .collect(Collectors.toMap(Question::getId, q -> q));
        attempt.getAnswers().forEach(aa -> {
            if (aa.getQuestion() != null) {
                Question fullQ = qMap.get(aa.getQuestion().getId());
                if (fullQ != null) aa.setQuestion(fullQ);
            }
        });
        return attempt;
    }

    private AttemptResponse toResponse(Attempt a, boolean includeAnswers) {
        AttemptResponse r = new AttemptResponse();
        r.setId(a.getId());
        r.setStatus(a.getStatus());
        r.setScore(a.getScore());
        r.setTotalScore(a.getTotalScore());
        r.setPassed(a.getPassed());
        r.setStartedAt(a.getStartedAt());
        r.setSubmittedAt(a.getSubmittedAt());
        r.setTimeRemainingSeconds(a.getTimeRemainingSeconds());
        r.setTabViolationCount(a.getTabViolationCount() != null ? a.getTabViolationCount() : 0);
        r.setQuestionOrder(a.getQuestionOrder()); // Thứ tự xáo trộn
        r.setExitCount(a.getExitCount() != null ? a.getExitCount() : 0);

        if (a.getExam() != null) {
            r.setExamId(a.getExam().getId());
            r.setExamTitle(a.getExam().getTitle());
            if (a.getExam().getCourse() != null)
                r.setCourseName(a.getExam().getCourse().getName());
            r.setAllowResume(a.getExam().getAllowResume() != null ? a.getExam().getAllowResume() : true);
        }
        if (a.getStudent() != null) {
            r.setStudentId(a.getStudent().getId());
            r.setStudentName(a.getStudent().getFullName());
            r.setStudentEmail(a.getStudent().getEmail());
            if (a.getStudent().getStudentProfile() != null)
                r.setStudentCode(a.getStudent().getStudentProfile().getStudentCode());
        }

        long correct = a.getAnswers().stream()
                .filter(aa -> Boolean.TRUE.equals(aa.getIsCorrect())).count();
        r.setCorrectCount((int) correct);
        r.setTotalQuestions(a.getAnswers().size());

        if (includeAnswers) {
            r.setAnswers(a.getAnswers().stream().map(aa -> {
                AttemptResponse.AttemptAnswerDetail d = new AttemptResponse.AttemptAnswerDetail();
                d.setId(aa.getId());
                if (aa.getQuestion() != null) {
                    d.setQuestionId(aa.getQuestion().getId());
                    d.setQuestionContent(aa.getQuestion().getContent());
                    d.setQuestionType(aa.getQuestion().getType().name());
                    aa.getQuestion().getAnswers().stream()
                            .filter(Answer::isCorrect).findFirst().ifPresent(ca -> {
                                d.setCorrectAnswerId(ca.getId());
                                d.setCorrectAnswerContent(ca.getContent());
                            });
                }
                if (aa.getSelectedAnswer() != null) {
                    d.setSelectedAnswerId(aa.getSelectedAnswer().getId());
                    d.setSelectedAnswerContent(aa.getSelectedAnswer().getContent());
                }
                d.setTextAnswer(aa.getTextAnswer());
                d.setIsCorrect(aa.getIsCorrect());
                d.setScore(aa.getScore());
                d.setTeacherComment(aa.getTeacherComment());
                return d;
            }).collect(Collectors.toList()));
        }
        return r;
    }

    // ── Generate randomized question order ──────────────────────────────────
    private String generateRandomizedQuestionOrder(Long examId) {
        // Lấy tất cả câu hỏi của đề thi theo thứ tự
        List<ExamQuestion> examQuestions = examRepo.findById(examId)
                .map(exam -> em.createQuery(
                        "SELECT eq FROM ExamQuestion eq WHERE eq.exam.id = :examId ORDER BY eq.orderIndex",
                        ExamQuestion.class)
                        .setParameter("examId", examId)
                        .getResultList())
                .orElse(new ArrayList<>());

        // Lấy danh sách ID câu hỏi
        List<Long> questionIds = examQuestions.stream()
                .map(eq -> eq.getQuestion().getId())
                .collect(Collectors.toList());

        // Xáo trộn
        Collections.shuffle(questionIds);

        // Chuyển thành JSON string: [id1, id2, id3, ...]
        return "[" + String.join(",", questionIds.stream()
                .map(String::valueOf).collect(Collectors.toList())) + "]";
    }
}