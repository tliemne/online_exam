package com.example.online_exam.discussion.service;

import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.discussion.dto.AttachmentDTO;
import com.example.online_exam.discussion.entity.DiscussionAttachment;
import com.example.online_exam.discussion.entity.DiscussionPost;
import com.example.online_exam.discussion.entity.DiscussionReply;
import com.example.online_exam.discussion.enums.FileType;
import com.example.online_exam.discussion.mapper.AttachmentMapper;
import com.example.online_exam.discussion.repository.DiscussionAttachmentRepository;
import com.example.online_exam.discussion.repository.DiscussionPostRepository;
import com.example.online_exam.discussion.repository.DiscussionReplyRepository;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DiscussionAttachmentService {

    private final DiscussionAttachmentRepository attachmentRepository;
    private final DiscussionPostRepository postRepository;
    private final DiscussionReplyRepository replyRepository;
    private final FileUploadService fileUploadService;
    private final AttachmentMapper attachmentMapper;
    private final CurrentUserService currentUserService;

    // Limits
    private static final int MAX_IMAGES_PER_POST = 5;
    private static final int MAX_IMAGES_PER_REPLY = 3;

    /**
     * Upload attachment to post
     */
    @Transactional
    public AttachmentDTO uploadPostAttachment(Long postId, MultipartFile file) {
        User currentUser = currentUserService.requireCurrentUser();
        DiscussionPost post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));

        // Check attachment limit
        long currentCount = attachmentRepository.countByPostId(postId);
        if (currentCount >= MAX_IMAGES_PER_POST) {
            throw new AppException(ErrorCode.TOO_MANY_ATTACHMENTS);
        }

        // Upload file
        String subDir = "posts/" + postId;
        String filePath = fileUploadService.uploadFile(file, subDir);
        FileType fileType = fileUploadService.determineFileType(
            file.getOriginalFilename(), 
            file.getContentType()
        );

        // Save attachment record
        DiscussionAttachment attachment = DiscussionAttachment.builder()
                .post(post)
                .filename(filePath.substring(filePath.lastIndexOf('/') + 1))
                .originalFilename(file.getOriginalFilename())
                .filePath(filePath)
                .fileType(fileType)
                .fileSize(file.getSize())
                .mimeType(file.getContentType())
                .createdBy(currentUser)
                .build();

        attachment = attachmentRepository.save(attachment);
        log.info("Uploaded attachment {} to post {}", attachment.getId(), postId);

        return attachmentMapper.toDTO(attachment);
    }

    /**
     * Upload attachment to reply
     */
    @Transactional
    public AttachmentDTO uploadReplyAttachment(Long replyId, MultipartFile file) {
        User currentUser = currentUserService.requireCurrentUser();
        DiscussionReply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));

        // Check attachment limit
        long currentCount = attachmentRepository.countByReplyId(replyId);
        if (currentCount >= MAX_IMAGES_PER_REPLY) {
            throw new AppException(ErrorCode.TOO_MANY_ATTACHMENTS);
        }

        // Upload file
        String subDir = "replies/" + replyId;
        String filePath = fileUploadService.uploadFile(file, subDir);
        FileType fileType = fileUploadService.determineFileType(
            file.getOriginalFilename(), 
            file.getContentType()
        );

        // Save attachment record
        DiscussionAttachment attachment = DiscussionAttachment.builder()
                .reply(reply)
                .filename(filePath.substring(filePath.lastIndexOf('/') + 1))
                .originalFilename(file.getOriginalFilename())
                .filePath(filePath)
                .fileType(fileType)
                .fileSize(file.getSize())
                .mimeType(file.getContentType())
                .createdBy(currentUser)
                .build();

        attachment = attachmentRepository.save(attachment);
        log.info("Uploaded attachment {} to reply {}", attachment.getId(), replyId);

        return attachmentMapper.toDTO(attachment);
    }

    /**
     * Delete attachment
     */
    @Transactional
    public void deleteAttachment(Long attachmentId) {
        User currentUser = currentUserService.requireCurrentUser();
        DiscussionAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new AppException(ErrorCode.FILE_NOT_FOUND));

        // Check permission
        boolean isOwner = attachment.getCreatedBy().getId().equals(currentUser.getId());
        boolean isAdmin = currentUserService.isAdmin(currentUser);
        boolean isTeacher = false;

        if (attachment.getPost() != null) {
            isTeacher = attachment.getPost().getCourse().getTeachers().stream()
                    .anyMatch(t -> t.getId().equals(currentUser.getId()));
        } else if (attachment.getReply() != null) {
            isTeacher = attachment.getReply().getPost().getCourse().getTeachers().stream()
                    .anyMatch(t -> t.getId().equals(currentUser.getId()));
        }

        if (!isOwner && !isAdmin && !isTeacher) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // Delete file from storage
        fileUploadService.deleteFile(attachment.getFilePath());

        // Delete record
        attachmentRepository.delete(attachment);
        log.info("Deleted attachment {}", attachmentId);
    }

    /**
     * Get attachment file
     */
    public byte[] getAttachmentFile(Long attachmentId) {
        log.info("Getting attachment file for ID: {}", attachmentId);
        DiscussionAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> {
                    log.error("Attachment not found in database: {}", attachmentId);
                    return new AppException(ErrorCode.FILE_NOT_FOUND);
                });

        log.info("Found attachment in DB: {}, filePath: {}", attachmentId, attachment.getFilePath());
        try {
            byte[] fileData = fileUploadService.getFile(attachment.getFilePath());
            log.info("Successfully loaded file: {} ({} bytes)", attachment.getFilePath(), fileData.length);
            return fileData;
        } catch (Exception e) {
            log.error("Failed to load file: {}, error: {}", attachment.getFilePath(), e.getMessage());
            throw e;
        }
    }

    /**
     * Get attachment info
     */
    public DiscussionAttachment getAttachment(Long attachmentId) {
        return attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new AppException(ErrorCode.FILE_NOT_FOUND));
    }

    /**
     * Get attachments for post
     */
    public List<AttachmentDTO> getPostAttachments(Long postId) {
        List<DiscussionAttachment> attachments = attachmentRepository.findByPostIdOrderByCreatedAtAsc(postId);
        return attachmentMapper.toDTOs(attachments);
    }

    /**
     * Get attachments for reply
     */
    public List<AttachmentDTO> getReplyAttachments(Long replyId) {
        List<DiscussionAttachment> attachments = attachmentRepository.findByReplyIdOrderByCreatedAtAsc(replyId);
        return attachmentMapper.toDTOs(attachments);
    }
}
