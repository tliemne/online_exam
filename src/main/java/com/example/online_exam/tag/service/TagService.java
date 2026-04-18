package com.example.online_exam.tag.service;

import com.example.online_exam.tag.dto.TagRequest;
import com.example.online_exam.tag.dto.TagResponse;

import java.util.List;

public interface TagService {
    List<TagResponse> getAll();
    org.springframework.data.domain.Page<TagResponse> getAllPaginated(int page, int size);
    TagResponse create(TagRequest req);
    TagResponse update(Long id, TagRequest req);
    void delete(Long id);
    void addTagsToQuestion(Long questionId, List<Long> tagIds);
    void setTagsOnQuestion(Long questionId, List<Long> tagIds);
}