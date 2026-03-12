package com.example.online_exam.question.service;

import com.example.online_exam.course.entity.Course;
import com.example.online_exam.course.repository.CourseRepository;
import com.example.online_exam.exam.repository.ExamQuestionRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.question.dto.AnswerRequest;
import com.example.online_exam.question.dto.AnswerResponse;
import com.example.online_exam.question.dto.QuestionRequest;
import com.example.online_exam.question.dto.QuestionResponse;
import com.example.online_exam.question.entity.Answer;
import com.example.online_exam.question.entity.Question;
import com.example.online_exam.question.enums.Difficulty;
import com.example.online_exam.question.enums.QuestionType;
import com.example.online_exam.attempt.repository.AttemptAnswerRepository;
import com.example.online_exam.attempt.repository.AttemptRepository;
import com.example.online_exam.question.repository.QuestionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.user.entity.User;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class QuestionServiceImpl implements QuestionService {

    private final QuestionRepository questionRepository;
    private final AttemptAnswerRepository attemptAnswerRepo;
    private final AttemptRepository attemptRepo;
    private final CourseRepository courseRepository;
    private final CurrentUserService currentUserService;
    private final ExamQuestionRepository examQuestionRepo;

    @Override
    public QuestionResponse create(QuestionRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        User currentUser = currentUserService.requireCurrentUser();

        Question question = new Question();
        question.setContent(request.getContent());
        question.setType(request.getType());
        question.setDifficulty(request.getDifficulty() != null ? request.getDifficulty() : Difficulty.MEDIUM);
        question.setCourse(course);
        question.setCreatedBy(currentUser);

        setAnswers(question, request);

        return toResponse(questionRepository.save(question));
    }

    @Override
    public QuestionResponse update(Long id, QuestionRequest request) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));

        if (request.getCourseId() != null && !request.getCourseId().equals(question.getCourse().getId())) {
            Course course = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
            question.setCourse(course);
        }

        question.setContent(request.getContent());
        question.setType(request.getType());
        if (request.getDifficulty() != null) question.setDifficulty(request.getDifficulty());

        // Nullify selected_answer trong attempt_answers trước khi xóa answers cũ
        // (ON DELETE SET NULL trong DB sẽ xử lý, nhưng nullify thủ công để chắc chắn)
        attemptAnswerRepo.nullifySelectedAnswerByQuestionId(id);

        question.getAnswers().clear();
        setAnswers(question, request);

        return toResponse(questionRepository.save(question));
    }

    @Override
    public void delete(Long id) {
        if (!questionRepository.existsById(id))
            throw new AppException(ErrorCode.QUESTION_NOT_FOUND);

        // Kiểm tra câu hỏi có đang được dùng trong đề thi nào không
        long examCount = examQuestionRepo.countByQuestionId(id);
        if (examCount > 0) {
            throw new AppException(ErrorCode.QUESTION_IN_USE);
        }

        // Nullify selected_answer trong attempt_answers để tránh FK constraint
        attemptAnswerRepo.nullifySelectedAnswerByQuestionId(id);

        // Xóa câu hỏi
        questionRepository.deleteById(id);
    }

    @Override
    public QuestionResponse getById(Long id) {
        return toResponse(questionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND)));
    }

    @Override
    public List<QuestionResponse> getByCourse(Long courseId) {
        return questionRepository.findByCourseId(courseId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    public List<QuestionResponse> search(Long courseId, QuestionType type, Difficulty difficulty, String keyword) {
        return questionRepository.search(courseId, type, difficulty, keyword)
                .stream().map(this::toResponse).toList();
    }

    @Override
    public Page<QuestionResponse> searchPaged(Long courseId, QuestionType type, Difficulty difficulty, String keyword, Pageable pageable) {
        return questionRepository.searchPaged(courseId, type, difficulty, keyword, pageable)
                .map(this::toResponse);
    }

    // ── Helpers ──────────────────────────────────────────

    private void setAnswers(Question question, QuestionRequest request) {
        if (request.getAnswers() == null) return;
        for (AnswerRequest ar : request.getAnswers()) {
            Answer answer = new Answer();
            answer.setContent(ar.getContent());
            answer.setCorrect(ar.isCorrect());
            answer.setQuestion(question);
            question.getAnswers().add(answer);
        }
    }

    private QuestionResponse toResponse(Question q) {
        QuestionResponse r = new QuestionResponse();
        r.setId(q.getId());
        r.setContent(q.getContent());
        r.setType(q.getType());
        r.setDifficulty(q.getDifficulty());
        r.setCourseId(q.getCourse().getId());
        r.setCourseName(q.getCourse().getName());
        r.setCreatedByName(q.getCreatedBy() != null ? q.getCreatedBy().getFullName() : null);
        r.setCreatedAt(q.getCreatedAt());
        r.setAnswers(q.getAnswers().stream().map(a -> {
            AnswerResponse ar = new AnswerResponse();
            ar.setId(a.getId());
            ar.setContent(a.getContent());
            ar.setCorrect(a.isCorrect());
            return ar;
        }).toList());
        return r;
    }
}