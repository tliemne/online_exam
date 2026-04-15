package com.example.online_exam.discussion.dto;

import com.example.online_exam.discussion.enums.FileType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttachmentDTO {
    private Long id;
    private String filename;
    private String originalFilename;
    private FileType fileType;
    private Long fileSize;
    private String mimeType;
    private String url;          // URL to view/download
    private String thumbnailUrl; // For images (optional)
    private String createdAt;
}
