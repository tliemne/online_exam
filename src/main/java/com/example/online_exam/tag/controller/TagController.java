package com.example.online_exam.tag.controller;

import com.example.online_exam.common.dto.BaseResponse;
import com.example.online_exam.tag.dto.TagRequest;
import com.example.online_exam.tag.dto.TagResponse;
import com.example.online_exam.tag.service.TagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    // GET /tags — all roles (student cũng có thể xem tag)
    @GetMapping
    public BaseResponse<?> getAll(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (page != null && size != null) {
            // Paginated request
            return ok(tagService.getAllPaginated(page, size));
        }
        // Non-paginated request (backward compatibility)
        return ok(tagService.getAll());
    }

    // POST /tags — TEACHER/ADMIN
    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public BaseResponse<TagResponse> create(@Valid @RequestBody TagRequest req) {
        return ok(tagService.create(req));
    }

    // PUT /tags/{id}
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public BaseResponse<TagResponse> update(@PathVariable Long id, @Valid @RequestBody TagRequest req) {
        return ok(tagService.update(id, req));
    }

    // DELETE /tags/{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public BaseResponse<Void> delete(@PathVariable Long id) {
        tagService.delete(id);
        return ok(null);
    }

    // PUT /tags/questions/{questionId} — set tags on question (replace all)
    @PutMapping("/questions/{questionId}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public BaseResponse<Void> setTags(
            @PathVariable Long questionId,
            @RequestBody List<Long> tagIds) {
        tagService.setTagsOnQuestion(questionId, tagIds);
        return ok(null);
    }

    private <T> BaseResponse<T> ok(T data) {
        return BaseResponse.<T>builder()
                .status(200)
                .message("Success")
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }
}