package com.example.online_exam.discussion.mapper;

import com.example.online_exam.discussion.dto.AttachmentDTO;
import com.example.online_exam.discussion.entity.DiscussionAttachment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Mapper(componentModel = "spring")
public interface AttachmentMapper {

    DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Mapping(target = "url", expression = "java(buildUrl(attachment))")
    @Mapping(target = "thumbnailUrl", expression = "java(buildThumbnailUrl(attachment))")
    @Mapping(target = "createdAt", expression = "java(formatDate(attachment))")
    AttachmentDTO toDTO(DiscussionAttachment attachment);

    List<AttachmentDTO> toDTOs(List<DiscussionAttachment> attachments);

    default String buildUrl(DiscussionAttachment attachment) {
        return "/api/discussions/attachments/" + attachment.getId();
    }

    default String buildThumbnailUrl(DiscussionAttachment attachment) {
        if (attachment.getFileType() == com.example.online_exam.discussion.enums.FileType.IMAGE) {
            return "/api/discussions/attachments/" + attachment.getId() + "/thumbnail";
        }
        return null;
    }

    default String formatDate(DiscussionAttachment attachment) {
        return attachment.getCreatedAt() != null 
            ? attachment.getCreatedAt().format(FORMATTER) 
            : null;
    }
}
