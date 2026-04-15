package com.example.online_exam.discussion.mapper;

import com.example.online_exam.discussion.dto.AttachmentDTO;
import com.example.online_exam.discussion.dto.AuthorDTO;
import com.example.online_exam.discussion.dto.DiscussionPostResponse;
import com.example.online_exam.discussion.entity.DiscussionPost;
import com.example.online_exam.discussion.entity.DiscussionTag;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public abstract class DiscussionPostMapper {

    @Autowired
    protected AttachmentMapper attachmentMapper;

    @Mapping(target = "courseId", source = "course.id")
    @Mapping(target = "courseName", source = "course.name")
    @Mapping(target = "author", expression = "java(mapAuthor(post.getAuthor()))")
    @Mapping(target = "tags", expression = "java(mapTags(post.getTags()))")
    @Mapping(target = "voteCount", expression = "java(post.getVoteCount() != null ? post.getVoteCount() : 0)")
    @Mapping(target = "dislikeCount", expression = "java(post.getDislikeCount() != null ? post.getDislikeCount() : 0)")
    @Mapping(target = "replyCount", expression = "java(post.getReplyCount() != null ? post.getReplyCount() : 0)")
    @Mapping(target = "attachments", expression = "java(mapAttachments(post))")
    @Mapping(target = "currentUserVote", ignore = true)
    @Mapping(target = "replies", ignore = true)
    public abstract DiscussionPostResponse toResponse(DiscussionPost post);

    public abstract List<DiscussionPostResponse> toResponses(List<DiscussionPost> posts);

    protected AuthorDTO mapAuthor(com.example.online_exam.user.entity.User user) {
        if (user == null) return null;
        AuthorDTO dto = new AuthorDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setFullName(user.getFullName());
        dto.setAvatarUrl(user.getAvatarUrl());
        return dto;
    }

    protected List<String> mapTags(java.util.Set<DiscussionTag> tags) {
        if (tags == null) return List.of();
        return tags.stream()
                .map(DiscussionTag::getName)
                .collect(Collectors.toList());
    }

    protected List<AttachmentDTO> mapAttachments(DiscussionPost post) {
        if (post.getAttachments() == null || post.getAttachments().isEmpty()) {
            return List.of();
        }
        return attachmentMapper.toDTOs(post.getAttachments().stream().toList());
    }
}
