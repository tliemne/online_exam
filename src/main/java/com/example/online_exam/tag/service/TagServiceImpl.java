package com.example.online_exam.tag.service;

import com.example.online_exam.activitylog.entity.ActivityLogAction;
import com.example.online_exam.activitylog.service.ActivityLogService;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.question.entity.Question;
import com.example.online_exam.question.repository.QuestionRepository;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.tag.dto.TagRequest;
import com.example.online_exam.tag.dto.TagResponse;
import com.example.online_exam.tag.entity.Tag;
import com.example.online_exam.tag.repository.TagRepository;
import com.example.online_exam.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TagServiceImpl implements TagService {

    private final TagRepository tagRepo;
    private final QuestionRepository questionRepo;
    private final CurrentUserService currentUserService;
    private final ActivityLogService activityLogService;

    @Override
    @Transactional(readOnly = true)
    public List<TagResponse> getAll() {
        List<Object[]> rows = tagRepo.countQuestionsByTag();
        return rows.stream().map(r -> {
            TagResponse res = new TagResponse();
            res.setId((Long) r[0]);
            res.setName((String) r[1]);
            res.setColor((String) r[2]);
            res.setQuestionCount((Long) r[3]);
            return res;
        }).collect(Collectors.toList());
    }

    @Override
    public TagResponse create(TagRequest req) {
        if (tagRepo.existsByName(req.getName().trim()))
            throw new AppException(ErrorCode.TAG_ALREADY_EXISTS);

        Tag tag = new Tag();
        tag.setName(req.getName().trim());
        tag.setDescription(req.getDescription());
        tag.setColor(req.getColor() != null ? req.getColor() : "#6b7280");
        tag = tagRepo.save(tag);

        User caller = currentUserService.requireCurrentUser();
        activityLogService.logUser(caller, ActivityLogAction.CREATE_TAG,
                "TAG", tag.getId(), "Tạo tag: " + tag.getName());

        return toResponse(tag, 0);
    }

    @Override
    public TagResponse update(Long id, TagRequest req) {
        Tag tag = tagRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST));
        if (!tag.getName().equals(req.getName().trim()) && tagRepo.existsByName(req.getName().trim()))
            throw new AppException(ErrorCode.TAG_ALREADY_EXISTS);

        tag.setName(req.getName().trim());
        tag.setDescription(req.getDescription());
        if (req.getColor() != null) tag.setColor(req.getColor());
        tagRepo.save(tag);

        User caller = currentUserService.requireCurrentUser();
        activityLogService.logUser(caller, ActivityLogAction.UPDATE_TAG,
                "TAG", id, "Cập nhật tag: " + tag.getName());

        List<Object[]> rows = tagRepo.countQuestionsByTag();
        long count = rows.stream()
                .filter(r -> r[0].equals(tag.getId()))
                .mapToLong(r -> (Long) r[3])
                .findFirst().orElse(0L);
        return toResponse(tag, count);
    }

    @Override
    public void delete(Long id) {
        Tag tag = tagRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST));

        String tagName = tag.getName();
        tag.getQuestions().forEach(q -> q.getTags().remove(tag));
        tagRepo.delete(tag);

        User caller = currentUserService.requireCurrentUser();
        activityLogService.logUser(caller, ActivityLogAction.DELETE_TAG,
                "TAG", id, "Xóa tag: " + tagName);
    }

    @Override
    public void addTagsToQuestion(Long questionId, List<Long> tagIds) {
        Question q = questionRepo.findById(questionId)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));
        List<Tag> tags = tagRepo.findAllById(tagIds);
        q.getTags().addAll(new HashSet<>(tags));
        questionRepo.save(q);
    }

    @Override
    public void setTagsOnQuestion(Long questionId, List<Long> tagIds) {
        Question q = questionRepo.findById(questionId)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));
        List<Tag> tags = tagRepo.findAllById(tagIds);
        q.getTags().clear();
        q.getTags().addAll(new HashSet<>(tags));
        questionRepo.save(q);
    }

    private TagResponse toResponse(Tag tag, long count) {
        TagResponse res = new TagResponse();
        res.setId(tag.getId());
        res.setName(tag.getName());
        res.setDescription(tag.getDescription());
        res.setColor(tag.getColor());
        res.setQuestionCount(count);
        return res;
    }
}