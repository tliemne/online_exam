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
import com.example.online_exam.question.repository.QuestionRepository;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AttemptServiceImpl implements AttemptService {

    private final AttemptRepository       attemptRepo;
    private final AttemptAnswerRepository answerRepo;
    private final ExamRepository          examRepo;
    private final QuestionRepository      questionRepo;
    private final CurrentUserService      currentUserService;

    // ── Submit ────────────────────────────────────────────
    @Override
    public AttemptResponse submit(Long examId, List<SubmitAnswerItem> items) {
        User student = currentUserService.requireCurrentUser();
        Exam exam    = examRepo.findById(examId)
                .orElseThrow(() -> new AppException(ErrorCode.EXAM_NOT_FOUND));

        // Kiểm tra số lần thi
        long doneCount = attemptRepo.countByExamIdAndStudentId(examId, student.getId());
        if (exam.getMaxAttempts() != null && doneCount >= exam.getMaxAttempts()) {
            throw new AppException(ErrorCode.INVALID_REQUEST); // Hết lượt thi
        }

        // Tạo attempt
        Attempt attempt = new Attempt();
        attempt.setExam(exam);
        attempt.setStudent(student);
        attempt.setStatus(AttemptStatus.SUBMITTED);
        attempt.setSubmittedAt(LocalDateTime.now());
        attempt.setTotalScore(exam.getTotalScore() != null ? exam.getTotalScore() : 10.0);
        attempt = attemptRepo.save(attempt);

        // Map questionId → ExamQuestion để lấy điểm từng câu
        Map<Long, ExamQuestion> examQMap = exam.getExamQuestions().stream()
                .collect(Collectors.toMap(eq -> eq.getQuestion().getId(), eq -> eq));

        // Lưu từng câu trả lời
        List<AttemptAnswer> savedAnswers = new ArrayList<>();
        double totalEarned = 0.0;
        int correctCount   = 0;
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
                // Tự luận — lưu text, chờ giáo viên chấm
                aa.setTextAnswer(item.getTextAnswer());
                aa.setIsCorrect(null);  // chưa biết
                aa.setScore(null);      // chưa chấm
                hasEssay = true;

            } else {
                // Trắc nghiệm / Đúng-Sai — chấm tự động
                Answer selected = null;
                if (item.getAnswerId() != null) {
                    selected = q.getAnswers().stream()
                            .filter(a -> a.getId().equals(item.getAnswerId()))
                            .findFirst().orElse(null);
                } else if ("true".equals(item.getTextAnswer()) || "false".equals(item.getTextAnswer())) {
                    // TRUE_FALSE dạng text
                    boolean chosenTrue = "true".equals(item.getTextAnswer());
                    selected = q.getAnswers().stream()
                            .filter(a -> a.isCorrect() == chosenTrue)
                            .findFirst().orElse(null);
                    // Set answerId sau
                }

                if (selected != null) {
                    aa.setSelectedAnswer(selected);
                    boolean correct = selected.isCorrect();
                    aa.setIsCorrect(correct);
                    if (correct) {
                        aa.setScore(qScore);
                        totalEarned += qScore;
                        correctCount++;
                    } else {
                        aa.setScore(0.0);
                    }
                } else {
                    aa.setIsCorrect(false);
                    aa.setScore(0.0);
                }
            }

            savedAnswers.add(aa);
        }

        answerRepo.saveAll(savedAnswers);

        // Cập nhật điểm attempt
        if (!hasEssay) {
            // Tất cả là trắc nghiệm → chấm xong ngay
            double percent = exam.getExamQuestions().isEmpty() ? 0
                    : totalEarned / exam.getExamQuestions().stream()
                    .mapToDouble(eq -> eq.getScore() != null ? eq.getScore() : 1.0).sum();
            double finalScore = Math.round(percent * attempt.getTotalScore() * 10.0) / 10.0;
            attempt.setScore(finalScore);
            attempt.setPassed(exam.getPassScore() == null || finalScore >= exam.getPassScore());
            attempt.setStatus(AttemptStatus.GRADED);
        }
        // Nếu có tự luận → status = SUBMITTED, giáo viên chấm sau

        attempt = attemptRepo.save(attempt);
        return toResponse(attempt, true);
    }

    // ── Get by ID ─────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public AttemptResponse getById(Long attemptId) {
        return toResponse(findAttempt(attemptId), true);
    }

    // ── Student history ───────────────────────────────────
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

    // ── Teacher view ──────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public List<AttemptResponse> getByExam(Long examId) {
        return attemptRepo.findByExamIdOrderBySubmittedAtDesc(examId)
                .stream().map(a -> toResponse(a, false)).collect(Collectors.toList());
    }

    // ── Grade (tự luận) ───────────────────────────────────
    @Override
    public AttemptResponse grade(Long attemptId, GradeRequest req) {
        Attempt attempt = findAttempt(attemptId);

        // Cập nhật từng câu
        for (GradeRequest.AnswerGrade ag : req.getAnswers()) {
            attempt.getAnswers().stream()
                    .filter(aa -> aa.getId().equals(ag.getAttemptAnswerId()))
                    .findFirst().ifPresent(aa -> {
                        if (ag.getScore()    != null) aa.setScore(ag.getScore());
                        if (ag.getIsCorrect()!= null) aa.setIsCorrect(ag.getIsCorrect());
                        if (ag.getTeacherComment() != null) aa.setTeacherComment(ag.getTeacherComment());
                    });
        }

        // Tính tổng điểm
        double total = attempt.getAnswers().stream()
                .mapToDouble(aa -> aa.getScore() != null ? aa.getScore() : 0.0).sum();

        double maxScore  = attempt.getTotalScore() != null ? attempt.getTotalScore() : 10.0;
        double maxEarnable = attempt.getExam().getExamQuestions().stream()
                .mapToDouble(eq -> eq.getScore() != null ? eq.getScore() : 1.0).sum();

        double finalScore = maxEarnable > 0
                ? Math.round((total / maxEarnable) * maxScore * 10.0) / 10.0
                : 0.0;

        attempt.setScore(finalScore);
        attempt.setPassed(attempt.getExam().getPassScore() == null
                || finalScore >= attempt.getExam().getPassScore());
        attempt.setStatus(AttemptStatus.GRADED);

        return toResponse(attemptRepo.save(attempt), true);
    }

    // ── Helpers ───────────────────────────────────────────
    private Attempt findAttempt(Long id) {
        return attemptRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ATTEMPT_NOT_FOUND));
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

        if (a.getExam() != null) {
            r.setExamId(a.getExam().getId());
            r.setExamTitle(a.getExam().getTitle());
            if (a.getExam().getCourse() != null)
                r.setCourseName(a.getExam().getCourse().getName());
        }
        if (a.getStudent() != null) {
            r.setStudentName(a.getStudent().getFullName());
            if (a.getStudent().getStudentProfile() != null)
                r.setStudentCode(a.getStudent().getStudentProfile().getStudentCode());
        }

        long correct = a.getAnswers().stream().filter(aa -> Boolean.TRUE.equals(aa.getIsCorrect())).count();
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

                    // Đáp án đúng
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
}