package com.example.online_exam.exam.service;

import com.example.online_exam.common.dto.BaseResponse;
import com.example.online_exam.course.entity.Course;
import com.example.online_exam.course.repository.CourseRepository;
import com.example.online_exam.exam.dto.*;
import com.example.online_exam.exam.entity.Exam;
import com.example.online_exam.exam.entity.ExamQuestion;
import com.example.online_exam.exam.enums.ExamStatus;
import com.example.online_exam.exam.repository.ExamQuestionRepository;
import com.example.online_exam.exam.repository.ExamRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.question.entity.Answer;
import com.example.online_exam.question.entity.Question;
import com.example.online_exam.question.repository.QuestionRepository;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ExamServiceImpl implements ExamService {

    private final ExamRepository        examRepo;
    private final ExamQuestionRepository examQRepo;
    private final CourseRepository      courseRepo;
    private final QuestionRepository    questionRepo;
    private final UserRepository        userRepo;
    private final CurrentUserService    currentUserService;

    // ── Create ────────────────────────────────────────────
    @Override
    public ExamResponse create(ExamRequest req) {
        Course course = courseRepo.findById(req.getCourseId())
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        User creator = currentUser();

        Exam exam = new Exam();
        mapRequest(req, exam);
        exam.setCourse(course);
        exam.setCreatedBy(creator);
        exam = examRepo.save(exam);

        // Thêm câu hỏi nếu có
        if (req.getQuestions() != null && !req.getQuestions().isEmpty()) {
            addQuestionsToExam(exam, req.getQuestions());
        }

        return toResponse(examRepo.findById(exam.getId()).orElseThrow(), true, false);
    }

    // ── Update ────────────────────────────────────────────
    @Override
    public ExamResponse update(Long id, ExamRequest req) {
        Exam exam = findExam(id);
        if (exam.getStatus() == ExamStatus.CLOSED)
            throw new AppException(ErrorCode.INVALID_REQUEST); // Không sửa đề đã đóng

        if (req.getCourseId() != null && !req.getCourseId().equals(exam.getCourse().getId())) {
            Course course = courseRepo.findById(req.getCourseId())
                    .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
            exam.setCourse(course);
        }

        mapRequest(req, exam);
        return toResponse(examRepo.save(exam), true, false);
    }

    // ── Delete ────────────────────────────────────────────
    @Override
    public void delete(Long id) {
        Exam exam = findExam(id);
        if (exam.getStatus() == ExamStatus.PUBLISHED)
            throw new AppException(ErrorCode.INVALID_REQUEST); // Không xóa đề đang mở
        examRepo.delete(exam);
    }

    // ── Get ───────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public ExamResponse getById(Long id, boolean includeQuestions, boolean hideCorrect) {
        return toResponse(findExam(id), includeQuestions, hideCorrect);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamResponse> getAll() {
        return examRepo.findAll().stream()
                .map(e -> toResponse(e, false, false)).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamResponse> getByCourse(Long courseId) {
        return examRepo.findByCourseId(courseId).stream()
                .map(e -> toResponse(e, false, false)).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamResponse> getForStudent(Long studentId) {
        return examRepo.findPublishedForStudent(studentId).stream()
                .map(e -> toResponse(e, false, false)).collect(Collectors.toList());
    }

    // ── Manage questions ──────────────────────────────────
    @Override
    public ExamResponse addQuestion(Long examId, ExamQuestionItem item) {
        return addQuestions(examId, List.of(item));
    }

    @Override
    public ExamResponse addQuestions(Long examId, List<ExamQuestionItem> items) {
        Exam exam = findExam(examId);
        addQuestionsToExam(exam, items);
        return toResponse(examRepo.findById(examId).orElseThrow(), true, false);
    }

    @Override
    public ExamResponse removeQuestion(Long examId, Long questionId) {
        findExam(examId);
        examQRepo.deleteByExamIdAndQuestionId(examId, questionId);
        return toResponse(findExam(examId), true, false);
    }

    @Override
    public ExamResponse reorderQuestions(Long examId, List<ExamQuestionItem> items) {
        Exam exam = findExam(examId);
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
        return toResponse(findExam(examId), true, false);
    }

    // ── Publish / Close ───────────────────────────────────
    @Override
    public ExamResponse publish(Long id) {
        Exam exam = findExam(id);
        if (exam.getExamQuestions().isEmpty())
            throw new AppException(ErrorCode.INVALID_REQUEST); // Phải có ít nhất 1 câu
        exam.setStatus(ExamStatus.PUBLISHED);
        return toResponse(examRepo.save(exam), false, false);
    }

    @Override
    public ExamResponse close(Long id) {
        Exam exam = findExam(id);
        exam.setStatus(ExamStatus.CLOSED);
        return toResponse(examRepo.save(exam), false, false);
    }

    // ── Helpers ───────────────────────────────────────────
    private void mapRequest(ExamRequest req, Exam exam) {
        exam.setTitle(req.getTitle());
        exam.setDescription(req.getDescription());
        exam.setDurationMinutes(req.getDurationMinutes());
        exam.setStartTime(req.getStartTime());
        exam.setEndTime(req.getEndTime());
        exam.setTotalScore(req.getTotalScore() != null ? req.getTotalScore() : 10.0);
        exam.setPassScore(req.getPassScore() != null ? req.getPassScore() : 5.0);
        exam.setRandomizeQuestions(req.getRandomizeQuestions() != null && req.getRandomizeQuestions());
        exam.setMaxAttempts(req.getMaxAttempts() != null ? req.getMaxAttempts() : 1);
    }

    private void addQuestionsToExam(Exam exam, List<ExamQuestionItem> items) {
        int currentMax = exam.getExamQuestions().size();
        List<ExamQuestion> toAdd = new ArrayList<>();

        for (int i = 0; i < items.size(); i++) {
            ExamQuestionItem item = items.get(i);
            if (examQRepo.existsByExamIdAndQuestionId(exam.getId(), item.getQuestionId()))
                continue; // Bỏ qua nếu đã có

            Question q = questionRepo.findById(item.getQuestionId())
                    .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));

            ExamQuestion eq = new ExamQuestion();
            eq.setExam(exam);
            eq.setQuestion(q);
            eq.setScore(item.getScore() != null ? item.getScore() : 1.0);
            eq.setOrderIndex(item.getOrderIndex() != null ? item.getOrderIndex() : currentMax + i);
            toAdd.add(eq);
        }
        examQRepo.saveAll(toAdd);
    }

    private ExamResponse toResponse(Exam exam, boolean includeQuestions, boolean hideCorrect) {
        ExamResponse r = new ExamResponse();
        r.setId(exam.getId());
        r.setTitle(exam.getTitle());
        r.setDescription(exam.getDescription());
        r.setDurationMinutes(exam.getDurationMinutes());
        r.setStartTime(exam.getStartTime());
        r.setEndTime(exam.getEndTime());
        r.setTotalScore(exam.getTotalScore());
        r.setPassScore(exam.getPassScore());
        r.setRandomizeQuestions(exam.getRandomizeQuestions());
        r.setMaxAttempts(exam.getMaxAttempts());
        r.setStatus(exam.getStatus());
        r.setCreatedAt(exam.getCreatedAt());

        if (exam.getCourse() != null) {
            r.setCourseId(exam.getCourse().getId());
            r.setCourseName(exam.getCourse().getName());
        }
        if (exam.getCreatedBy() != null)
            r.setCreatedByName(exam.getCreatedBy().getFullName());

        r.setQuestionCount(exam.getExamQuestions().size());

        if (includeQuestions) {
            r.setQuestions(exam.getExamQuestions().stream()
                    .map(eq -> toExamQResponse(eq, hideCorrect))
                    .collect(Collectors.toList()));
        }
        return r;
    }

    private ExamQuestionResponse toExamQResponse(ExamQuestion eq, boolean hideCorrect) {
        Question q = eq.getQuestion();
        ExamQuestionResponse r = new ExamQuestionResponse();
        r.setId(eq.getId());
        r.setQuestionId(q.getId());
        r.setContent(q.getContent());
        r.setType(q.getType());
        r.setDifficulty(q.getDifficulty());
        r.setScore(eq.getScore());
        r.setOrderIndex(eq.getOrderIndex());

        r.setAnswers(q.getAnswers().stream().map(a -> {
            ExamQuestionResponse.AnswerInExam ai = new ExamQuestionResponse.AnswerInExam();
            ai.setId(a.getId());
            ai.setContent(a.getContent());
            ai.setCorrect(hideCorrect ? null : a.isCorrect()); // null = ẩn đáp án đúng
            return ai;
        }).collect(Collectors.toList()));

        return r;
    }

    private Exam findExam(Long id) {
        return examRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.EXAM_NOT_FOUND));
    }

    private User currentUser() {
        return currentUserService.requireCurrentUser();
    }
}