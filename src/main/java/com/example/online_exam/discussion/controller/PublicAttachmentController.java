package com.example.online_exam.discussion.controller;

import com.example.online_exam.discussion.entity.DiscussionAttachment;
import com.example.online_exam.discussion.service.DiscussionAttachmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
public class PublicAttachmentController {

    private final DiscussionAttachmentService discussionAttachmentService;

    /**
     * Test endpoint to verify controller is working
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        log.info("PUBLIC CONTROLLER TEST: Endpoint is working!");
        return ResponseEntity.ok("Public controller is working!");
    }

    /**
     * Public endpoint to get attachment - NO AUTHENTICATION REQUIRED
     */
    @GetMapping("/attachments/{attachmentId}")
    public ResponseEntity<byte[]> getAttachment(@PathVariable Long attachmentId) {
        log.info("PUBLIC CONTROLLER: Getting attachment {}", attachmentId);
        
        try {
            DiscussionAttachment attachment = discussionAttachmentService.getAttachment(attachmentId);
            byte[] fileData = discussionAttachmentService.getAttachmentFile(attachmentId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(attachment.getMimeType()));
            headers.setContentDispositionFormData("inline", attachment.getOriginalFilename());
            headers.setContentLength(fileData.length);
            headers.setCacheControl("public, max-age=31536000");

            log.info("PUBLIC CONTROLLER: Successfully returning attachment {}", attachmentId);
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(fileData);
        } catch (Exception e) {
            log.error("PUBLIC CONTROLLER: Error getting attachment {}: {}", attachmentId, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Public endpoint to get thumbnail - NO AUTHENTICATION REQUIRED
     */
    @GetMapping("/attachments/{attachmentId}/thumbnail")
    public ResponseEntity<byte[]> getThumbnail(@PathVariable Long attachmentId) {
        log.info("PUBLIC CONTROLLER: Getting thumbnail {}", attachmentId);
        
        try {
            DiscussionAttachment attachment = discussionAttachmentService.getAttachment(attachmentId);
            byte[] fileData = discussionAttachmentService.getAttachmentFile(attachmentId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(attachment.getMimeType()));
            headers.setContentLength(fileData.length);
            headers.setCacheControl("public, max-age=31536000");

            log.info("PUBLIC CONTROLLER: Successfully returning thumbnail {}", attachmentId);
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(fileData);
        } catch (Exception e) {
            log.error("PUBLIC CONTROLLER: Error getting thumbnail {}: {}", attachmentId, e.getMessage(), e);
            throw e;
        }
    }
}
