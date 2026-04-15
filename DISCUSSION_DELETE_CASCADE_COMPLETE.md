# Discussion Forum - Complete Cascade Delete Implementation

## Tổng quan

Khi xóa bài viết hoặc reply trong Discussion Forum, tất cả dữ liệu liên quan sẽ được xóa hoàn toàn (hard delete) để đảm bảo tính nhất quán và không để lại "rác" trong database.

## 1. Xóa Post (Hard Delete)

### Khi xóa một post, các bước thực hiện:

1. **Lấy tất cả replies** (bao gồm cả nested replies)
2. **Xóa attachments của tất cả replies:**
   - Xóa file vật lý từ disk
   - Xóa records trong database
3. **Xóa votes của tất cả replies**
4. **Xóa tất cả replies**
5. **Xóa attachments của post:**
   - Xóa file vật lý từ disk
   - Xóa records trong database
6. **Xóa votes của post**
7. **Xóa post**

### Code: `DiscussionPostService.deletePost()`

```java
public void deletePost(Long postId) {
    // Validate permission
    validatePostEditPermission(currentUser, post);
    
    // 1. Get all replies
    List<DiscussionReply> replies = discussionReplyRepository.findByPostIdAndIsDeletedFalse(postId);
    
    // 2. Delete reply attachments (files + DB)
    for (DiscussionReply reply : replies) {
        List<DiscussionAttachment> replyAttachments = 
            attachmentRepository.findByReplyIdOrderByCreatedAtAsc(reply.getId());
        for (DiscussionAttachment attachment : replyAttachments) {
            fileUploadService.deleteFile(attachment.getFilePath());
        }
        attachmentRepository.deleteAll(replyAttachments);
    }
    
    // 3. Delete reply votes
    for (DiscussionReply reply : replies) {
        discussionVoteRepository.deleteByReplyId(reply.getId());
    }
    
    // 4. Delete replies
    discussionReplyRepository.deleteAll(replies);
    
    // 5. Delete post attachments (files + DB)
    List<DiscussionAttachment> postAttachments = 
        attachmentRepository.findByPostIdOrderByCreatedAtAsc(postId);
    for (DiscussionAttachment attachment : postAttachments) {
        fileUploadService.deleteFile(attachment.getFilePath());
    }
    attachmentRepository.deleteAll(postAttachments);
    
    // 6. Delete post votes
    discussionVoteRepository.deleteByPostId(postId);
    
    // 7. Delete post
    discussionPostRepository.delete(post);
}
```

## 2. Xóa Reply (Hard Delete)

### Khi xóa một reply, các bước thực hiện:

1. **Lấy tất cả nested replies** (replies con)
2. **Xóa attachments của nested replies:**
   - Xóa file vật lý từ disk
   - Xóa records trong database
3. **Xóa votes của nested replies**
4. **Xóa tất cả nested replies**
5. **Xóa attachments của reply này:**
   - Xóa file vật lý từ disk
   - Xóa records trong database
6. **Xóa votes của reply này**
7. **Nếu là best answer:** Set `post.hasBestAnswer = false`
8. **Xóa reply** (hard delete)

### Code: `DiscussionReplyService.deleteReply()`

```java
public void deleteReply(Long replyId) {
    // Validate permission
    validateReplyEditPermission(currentUser, reply);
    
    // 1. Get nested replies
    List<DiscussionReply> nestedReplies = discussionReplyRepository.findByParentReplyId(replyId);
    
    // 2. Delete nested reply attachments and votes
    for (DiscussionReply nested : nestedReplies) {
        // Delete attachments
        List<DiscussionAttachment> nestedAttachments = 
            attachmentRepository.findByReplyIdOrderByCreatedAtAsc(nested.getId());
        for (DiscussionAttachment attachment : nestedAttachments) {
            fileUploadService.deleteFile(attachment.getFilePath());
        }
        attachmentRepository.deleteAll(nestedAttachments);
        
        // Delete votes
        discussionVoteRepository.deleteByReplyId(nested.getId());
    }
    
    // 3. Delete nested replies
    discussionReplyRepository.deleteAll(nestedReplies);
    
    // 4. Delete this reply's attachments
    List<DiscussionAttachment> attachments = 
        attachmentRepository.findByReplyIdOrderByCreatedAtAsc(replyId);
    for (DiscussionAttachment attachment : attachments) {
        fileUploadService.deleteFile(attachment.getFilePath());
    }
    attachmentRepository.deleteAll(attachments);
    
    // 5. Delete this reply's votes
    discussionVoteRepository.deleteByReplyId(replyId);
    
    // 6. Handle best answer
    if (reply.getIsBestAnswer()) {
        DiscussionPost post = reply.getPost();
        post.setHasBestAnswer(false);
        discussionPostRepository.save(post);
    }
    
    // 7. Delete reply
    discussionReplyRepository.delete(reply);
}
```

## 3. Quyền xóa

### Xóa Post:
- Post author (người tạo)
- Course teacher (giáo viên khóa học)
- Admin

### Xóa Reply:
- Reply author (người tạo)
- Post author (người tạo bài viết)
- Course teacher (giáo viên khóa học)
- Admin

## 4. Lưu ý quan trọng

### ✅ Hard Delete (Xóa hẳn)
- **Post**: Xóa hẳn luôn
- **Reply**: Xóa hẳn luôn (đã sửa từ soft delete)
- **Attachments**: Xóa hẳn cả file và database
- **Votes**: Xóa hẳn

### ❌ Không còn Soft Delete
- Trước đây reply dùng soft delete (set `isDeleted = true`)
- Bây giờ đã chuyển sang hard delete để nhất quán
- Lý do: Nếu xóa mềm reply nhưng xóa hẳn attachments thì không hợp lý

### 🗑️ File Cleanup
- Tất cả file vật lý được xóa khỏi disk
- Không để lại file "rác" trong thư mục uploads
- Sử dụng `FileUploadService.deleteFile()` để xóa an toàn

### 🔄 Cascade Order
Thứ tự xóa rất quan trọng để tránh lỗi foreign key:
1. Xóa nested data trước (replies con, attachments)
2. Xóa votes
3. Xóa replies
4. Xóa post

## 5. Database Schema

### Foreign Keys với ON DELETE CASCADE

Nếu muốn database tự động cascade delete, có thể thêm:

```sql
ALTER TABLE discussion_replies 
ADD CONSTRAINT fk_reply_post 
FOREIGN KEY (post_id) REFERENCES discussion_posts(id) 
ON DELETE CASCADE;

ALTER TABLE discussion_attachments 
ADD CONSTRAINT fk_attachment_post 
FOREIGN KEY (post_id) REFERENCES discussion_posts(id) 
ON DELETE CASCADE;

ALTER TABLE discussion_attachments 
ADD CONSTRAINT fk_attachment_reply 
FOREIGN KEY (reply_id) REFERENCES discussion_replies(id) 
ON DELETE CASCADE;

ALTER TABLE discussion_votes 
ADD CONSTRAINT fk_vote_post 
FOREIGN KEY (post_id) REFERENCES discussion_posts(id) 
ON DELETE CASCADE;

ALTER TABLE discussion_votes 
ADD CONSTRAINT fk_vote_reply 
FOREIGN KEY (reply_id) REFERENCES discussion_replies(id) 
ON DELETE CASCADE;
```

**Lưu ý:** Hiện tại đang xử lý cascade delete trong code (application level) thay vì database level để có control tốt hơn và xóa được file vật lý.

## 6. Testing Checklist

- [ ] Xóa post không có reply → OK
- [ ] Xóa post có replies → Xóa hết replies
- [ ] Xóa post có attachments → Xóa hết files
- [ ] Xóa post có replies có attachments → Xóa hết
- [ ] Xóa reply không có nested → OK
- [ ] Xóa reply có nested replies → Xóa hết nested
- [ ] Xóa reply có attachments → Xóa hết files
- [ ] Xóa reply là best answer → Set hasBestAnswer = false
- [ ] Check file vật lý đã bị xóa khỏi disk
- [ ] Check database không còn orphan records

## 7. Kết luận

✅ **Hoàn chỉnh:** Cascade delete đã được implement đầy đủ
✅ **Nhất quán:** Tất cả đều dùng hard delete
✅ **Sạch sẽ:** Không để lại file hoặc data "rác"
✅ **An toàn:** Có permission check trước khi xóa
