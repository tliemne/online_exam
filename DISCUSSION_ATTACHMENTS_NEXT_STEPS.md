# Discussion Attachments - Next Implementation Steps

## ✅ Completed So Far

1. Database Schema - `DISCUSSION_ATTACHMENTS_SCHEMA.sql`
2. Entity - `DiscussionAttachment.java`
3. Enum - `FileType.java`
4. Repository - `DiscussionAttachmentRepository.java`
5. DTO - `AttachmentDTO.java`
6. Mapper - `AttachmentMapper.java`
7. Service - `FileUploadService.java`
8. Error Codes - Added to `ErrorCode.java`

## 🔄 Next: Update Existing DTOs

### Update DiscussionPostResponse.java
Add field:
```java
private List<AttachmentDTO> attachments;
```

### Update DiscussionReplyResponse.java
Add field:
```java
private List<AttachmentDTO> attachments;
```

### Update Mappers
- `DiscussionPostMapper.java` - Map attachments
- `DiscussionReplyMapper.java` - Map attachments

## 🔄 Next: Update Services

### DiscussionPostService.java
- Load attachments when getting post detail
- Delete attachments when deleting post (already cascades in DB)

### DiscussionReplyService.java
- Load attachments when getting replies
- Delete attachments when deleting reply (already cascades in DB)

### Create DiscussionAttachmentService.java
```java
@Service
public class DiscussionAttachmentService {
    // uploadAttachment(postId/replyId, file, user)
    // deleteAttachment(attachmentId, user)
    // getAttachment(attachmentId)
    // validateAttachmentLimits(postId/replyId)
}
```

## 🔄 Next: Add Controller Endpoints

### DiscussionForumController.java
Add endpoints:

```java
// Upload attachment to post
@PostMapping("/{postId}/attachments")
public ResponseEntity<AttachmentDTO> uploadPostAttachment(
    @PathVariable Long postId,
    @RequestParam("file") MultipartFile file
)

// Upload attachment to reply
@PostMapping("/replies/{replyId}/attachments")
public ResponseEntity<AttachmentDTO> uploadReplyAttachment(
    @PathVariable Long replyId,
    @RequestParam("file") MultipartFile file
)

// Delete attachment
@DeleteMapping("/attachments/{attachmentId}")
public ResponseEntity<Void> deleteAttachment(@PathVariable Long attachmentId)

// Get/Download attachment
@GetMapping("/attachments/{attachmentId}")
public ResponseEntity<byte[]> getAttachment(@PathVariable Long attachmentId)

// Get thumbnail (for images)
@GetMapping("/attachments/{attachmentId}/thumbnail")
public ResponseEntity<byte[]> getThumbnail(@PathVariable Long attachmentId)
```

## 🔄 Next: Frontend Implementation

### 1. Create Components
- `ImageUploader.jsx` - Upload images with preview
- `ImageGallery.jsx` - Display images in grid + lightbox
- `AttachmentToolbar.jsx` - Toolbar with buttons (📷 Ảnh, 📎 File, etc.)

### 2. Update Modals
- `CreatePostModal.jsx` - Add image upload UI
- `PostDetailModal.jsx` - Display images

### 3. Update API Service
```javascript
// exam-frontend/src/api/services.js
export const discussionApi = {
  // ... existing methods
  
  uploadAttachment: (postId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/api/discussions/${postId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  uploadReplyAttachment: (replyId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/api/discussions/replies/${replyId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  deleteAttachment: (attachmentId) => 
    api.delete(`/api/discussions/attachments/${attachmentId}`),
  
  getAttachmentUrl: (attachmentId) => 
    `/api/discussions/attachments/${attachmentId}`,
}
```

## Configuration Needed

### application.properties
```properties
# File upload
spring.servlet.multipart.enabled=true
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=50MB

# Upload directory
app.upload.dir=uploads/discussion
app.upload.max-image-size=5242880
app.upload.max-file-size=10485760
```

### Create upload directory
```bash
mkdir -p uploads/discussion
```

## Limits to Enforce

### Backend Validation
- Max 5 images per post
- Max 3 images per reply
- Max 5MB per image
- Max 10MB per file
- Check file type and extension

### Frontend Validation
- Show error if limits exceeded
- Disable upload button when limit reached
- Show file size before upload

## Ready to Continue?

Tôi sẽ tiếp tục implement:
1. Update DTOs và Mappers
2. Create AttachmentService
3. Add Controller endpoints
4. Test backend với Postman
5. Implement frontend components

Bạn muốn tôi tiếp tục không?
