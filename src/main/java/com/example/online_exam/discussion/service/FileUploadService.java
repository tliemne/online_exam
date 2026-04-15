package com.example.online_exam.discussion.service;

import com.example.online_exam.common.exception.AppException;
import com.example.online_exam.common.exception.ErrorCode;
import com.example.online_exam.discussion.enums.FileType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class FileUploadService {

    @Value("${app.upload.dir:uploads/discussion}")
    private String uploadDir;

    @Value("${app.upload.max-image-size:5242880}") // 5MB default
    private long maxImageSize;

    @Value("${app.upload.max-file-size:10485760}") // 10MB default
    private long maxFileSize;

    // Allowed image formats
    private static final List<String> IMAGE_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "gif", "webp");
    private static final List<String> IMAGE_MIME_TYPES = Arrays.asList(
        "image/jpeg", "image/png", "image/gif", "image/webp"
    );

    // Allowed document formats
    private static final List<String> DOCUMENT_EXTENSIONS = Arrays.asList(
        "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "zip", "rar"
    );

    /**
     * Upload file to local storage
     * Returns the file path relative to upload directory
     */
    public String uploadFile(MultipartFile file, String subDir) {
        validateFile(file);

        try {
            // Create directory if not exists
            Path uploadPath = Paths.get(uploadDir, subDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = getFileExtension(originalFilename);
            String uniqueFilename = UUID.randomUUID().toString() + "." + extension;

            // Save file
            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Return relative path
            return subDir + "/" + uniqueFilename;

        } catch (IOException e) {
            log.error("Failed to upload file: {}", e.getMessage());
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        }
    }

    /**
     * Delete file from local storage
     */
    public void deleteFile(String filePath) {
        try {
            Path path = Paths.get(uploadDir, filePath);
            Files.deleteIfExists(path);
            log.info("Deleted file: {}", filePath);
        } catch (IOException e) {
            log.error("Failed to delete file: {}", e.getMessage());
        }
    }

    /**
     * Get file from local storage
     */
    public byte[] getFile(String filePath) {
        try {
            Path path = Paths.get(uploadDir, filePath);
            return Files.readAllBytes(path);
        } catch (IOException e) {
            log.error("Failed to read file: {}", e.getMessage());
            throw new AppException(ErrorCode.FILE_NOT_FOUND);
        }
    }

    /**
     * Validate file before upload
     */
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.FILE_EMPTY);
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new AppException(ErrorCode.INVALID_FILE);
        }

        String extension = getFileExtension(originalFilename).toLowerCase();
        String mimeType = file.getContentType();

        // Check if it's an image
        boolean isImage = IMAGE_EXTENSIONS.contains(extension) && 
                         (mimeType != null && IMAGE_MIME_TYPES.contains(mimeType));

        // Check if it's a document
        boolean isDocument = DOCUMENT_EXTENSIONS.contains(extension);

        if (!isImage && !isDocument) {
            throw new AppException(ErrorCode.INVALID_FILE_TYPE);
        }

        // Check file size
        long maxSize = isImage ? maxImageSize : maxFileSize;
        if (file.getSize() > maxSize) {
            throw new AppException(ErrorCode.FILE_TOO_LARGE);
        }
    }

    /**
     * Determine file type from extension and mime type
     */
    public FileType determineFileType(String filename, String mimeType) {
        String extension = getFileExtension(filename).toLowerCase();

        if (IMAGE_EXTENSIONS.contains(extension) && 
            (mimeType != null && IMAGE_MIME_TYPES.contains(mimeType))) {
            return FileType.IMAGE;
        }

        if (DOCUMENT_EXTENSIONS.contains(extension)) {
            return FileType.DOCUMENT;
        }

        return FileType.OTHER;
    }

    /**
     * Get file extension from filename
     */
    private String getFileExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');
        if (lastDot == -1) {
            return "";
        }
        return filename.substring(lastDot + 1);
    }

    /**
     * Format file size for display
     */
    public static String formatFileSize(long size) {
        if (size < 1024) return size + " B";
        if (size < 1024 * 1024) return String.format("%.1f KB", size / 1024.0);
        return String.format("%.1f MB", size / (1024.0 * 1024.0));
    }
}
