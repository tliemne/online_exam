package com.example.online_exam.discussion.mapper;

import com.example.online_exam.discussion.dto.AttachmentDTO;
import com.example.online_exam.discussion.dto.AuthorDTO;
import com.example.online_exam.discussion.dto.DiscussionReplyResponse;
import com.example.online_exam.discussion.entity.DiscussionReply;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

@Mapper(componentModel = "spring")
public abstract class DiscussionReplyMapper {

    @Autowired
    protected AttachmentMapper attachmentMapper;

    @Mapping(target = "postId", source = "post.id")
    @Mapping(target = "parentReplyId", source = "parentReply.id")
    @Mapping(target = "author", expression = "java(mapAuthor(reply.getAuthor()))")
    @Mapping(target = "voteCount", expression = "java(reply.getVoteCount() != null ? reply.getVoteCount() : 0)")
    @Mapping(target = "dislikeCount", expression = "java(reply.getDislikeCount() != null ? reply.getDislikeCount() : 0)")
    @Mapping(target = "attachments", expression = "java(mapAttachments(reply))")
    @Mapping(target = "currentUserVote", ignore = true)
    public abstract DiscussionReplyResponse toResponse(DiscussionReply reply);

    public abstract List<DiscussionReplyResponse> toResponses(List<DiscussionReply> replies);

    protected AuthorDTO mapAuthor(com.example.online_exam.user.entity.User user) {
        if (user == null) return null;
        AuthorDTO dto = new AuthorDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setFullName(user.getFullName());
        dto.setAvatarUrl(user.getAvatarUrl());
        return dto;
    }

    protected List<AttachmentDTO> mapAttachments(DiscussionReply reply) {
        if (reply.getAttachments() == null || reply.getAttachments().isEmpty()) {
            return List.of();
        }
        return attachmentMapper.toDTOs(reply.getAttachments().stream().toList());
    }
}
