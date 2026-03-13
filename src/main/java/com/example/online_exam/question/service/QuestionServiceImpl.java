package com.example.online_exam.question.service;

import com.example.online_exam.activitylog.entity.ActivityLogAction;
import com.example.online_exam.activitylog.service.ActivityLogService;
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
import com.example.online_exam.question.repository.QuestionRepository;
import com.example.online_exam.tag.dto.TagResponse;
import com.example.online_exam.tag.entity.Tag;
import com.example.online_exam.tag.repository.TagRepository;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.user.entity.User;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class QuestionServiceImpl implements QuestionService {

    private final QuestionRepository questionRepository;
    private final AttemptAnswerRepository attemptAnswerRepo;
    private final CourseRepository courseRepository;
    private final CurrentUserService currentUserService;
    private final ExamQuestionRepository examQuestionRepo;
    private final TagRepository tagRepository;
    private final ActivityLogService activityLogService;

    @Override
    public QuestionResponse create(QuestionRequest request) {

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        User currentUser = currentUserService.requireCurrentUser();

        Question question = new Question();
        question.setContent(request.getContent());
        question.setType(request.getType());
        question.setDifficulty(
                request.getDifficulty() != null ? request.getDifficulty() : Difficulty.MEDIUM
        );
        question.setCourse(course);
        question.setCreatedBy(currentUser);

        setAnswers(question, request);
        setTags(question, request);

        QuestionResponse resp = toResponse(questionRepository.save(question));

        activityLogService.logUser(
                currentUser,
                ActivityLogAction.CREATE_QUESTION,
                "QUESTION",
                resp.getId(),
                "Tạo câu hỏi trong lớp: " + course.getName()
        );

        return resp;
    }

    @Override
    public QuestionResponse update(Long id, QuestionRequest request) {

        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));

        if (request.getCourseId() != null &&
                !request.getCourseId().equals(question.getCourse().getId())) {

            Course course = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

            question.setCourse(course);
        }

        question.setContent(request.getContent());
        question.setType(request.getType());

        if (request.getDifficulty() != null) {
            question.setDifficulty(request.getDifficulty());
        }

        attemptAnswerRepo.nullifySelectedAnswerByQuestionId(id);

        question.getAnswers().clear();

        setAnswers(question, request);
        setTags(question, request);

        QuestionResponse resp = toResponse(questionRepository.save(question));

        User caller = currentUserService.requireCurrentUser();

        activityLogService.logUser(
                caller,
                ActivityLogAction.UPDATE_QUESTION,
                "QUESTION",
                id,
                "Cập nhật câu hỏi #" + id
        );

        return resp;
    }

    @Override
    public void delete(Long id) {

        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));

        long examCount = examQuestionRepo.countByQuestionId(id);

        if (examCount > 0) {
            throw new AppException(ErrorCode.QUESTION_IN_USE);
        }

        attemptAnswerRepo.nullifySelectedAnswerByQuestionId(id);

        questionRepository.deleteById(id);

        User caller = currentUserService.requireCurrentUser();

        activityLogService.logUser(
                caller,
                ActivityLogAction.DELETE_QUESTION,
                "QUESTION",
                id,
                "Xóa câu hỏi #" + id
        );
    }

    @Override
    public QuestionResponse getById(Long id) {
        return toResponse(
                questionRepository.findById(id)
                        .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND))
        );
    }

    @Override
    public List<QuestionResponse> getByCourse(Long courseId) {

        return questionRepository.findByCourseId(courseId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<QuestionResponse> search(Long courseId,
                                         QuestionType type,
                                         Difficulty difficulty,
                                         String keyword) {

        return questionRepository.search(courseId, type, difficulty, keyword)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public Page<QuestionResponse> searchPaged(Long courseId,
                                              QuestionType type,
                                              Difficulty difficulty,
                                              String keyword,
                                              Pageable pageable) {

        return questionRepository.searchPaged(courseId, type, difficulty, keyword, pageable)
                .map(this::toResponse);
    }

    @Override
    public List<QuestionResponse> searchWithTag(Long courseId,
                                                QuestionType type,
                                                Difficulty difficulty,
                                                String keyword,
                                                Long tagId) {

        if (tagId == null) {
            return questionRepository.search(courseId, type, difficulty, keyword)
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        return questionRepository.searchWithTag(courseId, type, difficulty, keyword, tagId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public Page<QuestionResponse> searchPagedWithTag(Long courseId,
                                                     QuestionType type,
                                                     Difficulty difficulty,
                                                     String keyword,
                                                     Long tagId,
                                                     Pageable pageable) {

        return questionRepository.searchPagedWithTag(
                courseId,
                type,
                difficulty,
                keyword,
                tagId,
                pageable
        ).map(this::toResponse);
    }

    // helpers

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

    private void setTags(Question question, QuestionRequest request) {

        if (request.getTagIds() != null) {

            List<Tag> tags = tagRepository.findAllById(request.getTagIds());

            question.getTags().clear();
            question.getTags().addAll(new java.util.HashSet<>(tags));
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

        r.setCreatedByName(
                q.getCreatedBy() != null
                        ? q.getCreatedBy().getFullName()
                        : null
        );

        r.setCreatedAt(q.getCreatedAt());

        r.setAnswers(
                q.getAnswers()
                        .stream()
                        .map(a -> {

                            AnswerResponse ar = new AnswerResponse();

                            ar.setId(a.getId());
                            ar.setContent(a.getContent());
                            ar.setCorrect(a.isCorrect());

                            return ar;

                        }).toList()
        );

        r.setTags(
                q.getTags()
                        .stream()
                        .map(t -> {

                            TagResponse tr = new TagResponse();

                            tr.setId(t.getId());
                            tr.setName(t.getName());
                            tr.setColor(t.getColor());

                            return tr;

                        }).toList()
        );

        return r;
    }
}