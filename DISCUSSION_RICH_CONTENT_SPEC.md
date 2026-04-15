# Discussion Forum - Rich Content Support

## Overview
Nâng cấp Discussion Forum để hỗ trợ nội dung đa phương tiện: ảnh, link, và file đính kèm.

## Features

### 1. Image Upload (Đăng ảnh)
**Cho phép:**
- Upload ảnh khi tạo post/reply
- Hiển thị ảnh inline trong nội dung
- Preview ảnh trước khi đăng
- Click để xem ảnh full size (lightbox)

**Giới hạn:**
- Max 5 ảnh/post
- Max 3 ảnh/reply
- File size: Max 5MB/ảnh
- Format: JPG, PNG, GIF, WEBP

**Storage:**
- Lưu trên server filesystem hoặc cloud storage
- Path: `/uploads/discussion/{postId}/{filename}`

### 2. Link Embedding (Gắn link)
**Cho phép:**
- Paste URL vào content
- Auto-detect và render link preview
- Support: YouTube, images, general URLs

**Preview:**
- YouTube: Embed video player
- Image URL: Show image inline
- General URL: Show link card với title/description

### 3. File Attachments (Đính kèm file)
**Cho phép:**
- Upload file đính kèm
- Download file
- Hiển thị icon theo loại file

**Giới hạn:**
- Max 3 files/post
- Max 1 file/reply
- File size: Max 10MB/file
- Format: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP

**Storage:**
- Path: `/uploads/discussion/attachments/{postId}/{filename}`

## Database Schema Changes

### New Table: `discussion_attachments`
```sql
CREATE TABLE discussion_attachments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT,
    reply_id BIGINT,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'IMAGE', 'DOCUMENT', 'VIDEO', 'OTHER'
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    
    FOREIGN KEY (post_id) REFERENCES discussion_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_id) REFERENCES discussion_replies(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    INDEX idx_post (post_id),
    INDEX idx_reply (reply_id)
);
```

### Update Existing Tables
No changes needed - attachments are separate table.

## Backend Implementation

### 1. Entity
```java
@Entity
@Table(name = "discussion_attachments")
public class DiscussionAttachment extends BaseEntity {
    @ManyToOne
    @JoinColumn(name = "post_id")
    private DiscussionPost post;
    
    @ManyToOne
    @JoinColumn(name = "reply_id")
    private DiscussionReply reply;
    
    private String filename;
    private String originalFilename;
    private String filePath;
    
    @Enumerated(EnumType.STRING)
    private FileType fileType; // IMAGE, DOCUMENT, VIDEO, OTHER
    
    private Long fileSize;
    private String mimeType;
    
    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;
}
```

### 2. File Upload Service
```java
@Service
public class FileUploadService {
    private final String uploadDir = "uploads/discussion";
    
    public String uploadFile(MultipartFile file, String subDir) {
        // Validate file
        // Generate unique filename
        // Save to disk
        // Return file path
    }
    
    public void deleteFile(String filePath) {
        // Delete file from disk
    }
}
```

### 3. API Endpoints

#### Upload Attachment
```
POST /api/discussions/{postId}/attachments
POST /api/discussions/replies/{replyId}/attachments
Content-Type: multipart/form-data

Body: file (MultipartFile)

Response: {
    id, filename, originalFilename, filePath, fileType, fileSize, downloadUrl
}
```

#### Delete Attachment
```
DELETE /api/discussions/attachments/{attachmentId}
```

#### Download Attachment
```
GET /api/discussions/attachments/{attachmentId}/download
```

### 4. DTO Updates
```java
public class DiscussionPostResponse {
    // ... existing fields
    private List<AttachmentDTO> attachments;
}

public class AttachmentDTO {
    private Long id;
    private String filename;
    private String originalFilename;
    private String fileType;
    private Long fileSize;
    private String downloadUrl;
    private String thumbnailUrl; // for images
}
```

## Frontend Implementation

### 1. Rich Text Editor
Use a simple rich text editor or markdown editor:
- **Option 1**: React-Quill (WYSIWYG)
- **Option 2**: SimpleMDE (Markdown)
- **Option 3**: Custom textarea with formatting buttons

**Recommendation**: Custom textarea + formatting toolbar (simpler, lighter)

### 2. Image Upload Component
```jsx
<ImageUploader
  maxImages={5}
  maxSize={5 * 1024 * 1024}
  onUpload={handleImageUpload}
  images={images}
  onRemove={handleRemoveImage}
/>
```

Features:
- Drag & drop
- Preview thumbnails
- Remove button
- Progress indicator

### 3. File Attachment Component
```jsx
<FileAttachment
  maxFiles={3}
  maxSize={10 * 1024 * 1024}
  allowedTypes={['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip']}
  files={files}
  onUpload={handleFileUpload}
  onRemove={handleRemoveFile}
/>
```

### 4. Link Preview
Auto-detect URLs in content and show preview:
```jsx
<LinkPreview url={detectedUrl} />
```

For YouTube:
```jsx
<YouTubeEmbed videoId={extractVideoId(url)} />
```

### 5. Updated CreatePostModal
```jsx
<CreatePostModal>
  <textarea /> {/* Content */}
  
  <div className="toolbar">
    <button>Bold</button>
    <button>Italic</button>
    <button>Link</button>
    <button>Image</button>
    <button>File</button>
  </div>
  
  <ImageUploader />
  <FileAttachment />
  
  <button>Đăng bài</button>
</CreatePostModal>
```

### 6. Display in PostDetailModal
```jsx
<PostDetailModal>
  <div className="content">
    {renderContent(post.content)} {/* Parse markdown/HTML */}
  </div>
  
  {post.attachments?.images && (
    <ImageGallery images={post.attachments.images} />
  )}
  
  {post.attachments?.files && (
    <FileList files={post.attachments.files} />
  )}
</PostDetailModal>
```

## UI/UX Design

### Image Display
- Thumbnails in grid (2-3 columns)
- Click to open lightbox
- Lightbox with prev/next navigation

### File Display
- List with icon, filename, size
- Download button
- File type icon (PDF, DOC, etc.)

### Link Preview
- Card with thumbnail, title, description
- Click to open in new tab

## Security Considerations

1. **File Validation**
   - Check file extension
   - Check MIME type
   - Scan for malware (optional)

2. **File Size Limits**
   - Enforce on both frontend and backend
   - Return clear error messages

3. **Access Control**
   - Only post/reply author can delete attachments
   - Teachers can delete any attachment in their course
   - Admins can delete any attachment

4. **Storage**
   - Store files outside web root
   - Serve files through controller (not direct access)
   - Generate unique filenames to prevent conflicts

## Implementation Steps

### Phase 1: Image Upload (Priority 1)
1. Create database table
2. Create entity and repository
3. Create upload service
4. Add API endpoints
5. Create ImageUploader component
6. Update CreatePostModal
7. Update PostDetailModal to display images

### Phase 2: File Attachments (Priority 2)
1. Extend attachment table (already supports files)
2. Add file upload endpoints
3. Create FileAttachment component
4. Update modals
5. Add download functionality

### Phase 3: Link Preview (Priority 3)
1. Create link detection utility
2. Create LinkPreview component
3. Add YouTube embed support
4. Update content rendering

## Estimated Effort
- Phase 1 (Images): 8-10 hours
- Phase 2 (Files): 4-6 hours
- Phase 3 (Links): 3-4 hours
- **Total**: 15-20 hours

## Notes
- Start with images first (most requested feature)
- Files are similar to images (reuse upload logic)
- Link preview is optional enhancement
- Consider using cloud storage (AWS S3, Cloudinary) for production
