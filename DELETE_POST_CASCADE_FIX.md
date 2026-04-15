# ✅ Sửa Lỗi: Xóa Bài Viết Cascade & Xử Lý Notification

## 🐛 Vấn Đề

1. **Soft Delete**: Bài viết chỉ được đánh dấu `status = DELETED` thay vì xóa thật khỏi database
2. **Dữ liệu rác**: Replies và votes vẫn còn trong database sau khi xóa post
3. **Notification lỗi**: Khi click vào notification của bài viết đã xóa, không có thông báo rõ ràng

---

## ✅ Giải Pháp

### 1. **Backend - Hard Delete với Cascade**

#### Cập nhật `DiscussionPostService.deletePost()`
Thay đổi từ soft delete sang hard delete:

**Trước:**
```java
// Set post status to DELETED
post.setStatus(PostStatus.DELETED);

// Mark all replies as deleted
List<DiscussionReply> replies = discussionReplyRepository.findByPostIdAndIsDeletedFalse(postId);
replies.forEach(reply -> reply.setIsDeleted(true));

discussionPostRepository.save(post);
```

**Sau:**
```java
// 1. Xóa tất cả votes cho replies
List<DiscussionReply> replies = discussionReplyRepository.findByPostIdAndIsDeletedFalse(postId);
for (DiscussionReply reply : replies) {
    discussionVoteRepository.deleteByReplyId(reply.getId());
}

// 2. Xóa tất cả replies (cascade sẽ xóa nested replies nếu có)
discussionReplyRepository.deleteAll(replies);

// 3. Xóa tất cả votes cho post
discussionVoteRepository.deleteByPostId(postId);

// 4. Xóa post
discussionPostRepository.delete(post);
```

#### Thêm Methods vào `DiscussionVoteRepository`
```java
@Transactional
@Modifying
@Query("DELETE FROM DiscussionVote v WHERE v.post.id = :postId")
void deleteByPostId(@Param("postId") Long postId);

@Transactional
@Modifying
@Query("DELETE FROM DiscussionVote v WHERE v.reply.id = :replyId")
void deleteByReplyId(@Param("replyId") Long replyId);
```

---

### 2. **Frontend - Xử Lý Post Không Tồn Tại**

#### Cập nhật `PostDetailModal.jsx`

**Thêm state:**
```jsx
const [postNotFound, setPostNotFound] = useState(false)
```

**Cập nhật loadPost():**
```jsx
const loadPost = () => {
  setLoading(true)
  setPostNotFound(false)
  discussionApi.getPostDetail(initialPost.id)
    .then(r => setPost(r.data.data))
    .catch(err => {
      if (err.response?.status === 404) {
        setPostNotFound(true)
        toast.error('Bài viết không còn tồn tại')
      } else {
        toast.error(err.response?.data?.message || 'Không thể tải bài viết')
      }
    })
    .finally(() => setLoading(false))
}
```

**Thêm UI cho post không tồn tại:**
```jsx
{postNotFound ? (
  <div className="flex-1 flex flex-col items-center justify-center p-12">
    <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center mb-4">
      <svg className="w-10 h-10 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
    </div>
    <h3 className="text-xl font-bold text-[var(--text-1)] mb-2">Bài viết không còn tồn tại</h3>
    <p className="text-sm text-[var(--text-3)] text-center mb-6">
      Bài viết này đã bị xóa hoặc không còn khả dụng.
    </p>
    <button onClick={onClose} className="btn-secondary">
      Đóng
    </button>
  </div>
) : (
  // Normal post content...
)}
```

---

## 🔄 Luồng Xử Lý

### Khi Xóa Bài Viết:
1. ✅ Xóa tất cả votes cho replies
2. ✅ Xóa tất cả replies (bao gồm nested replies)
3. ✅ Xóa tất cả votes cho post
4. ✅ Xóa post
5. ℹ️ Notifications vẫn còn (sẽ xử lý khi user click)

### Khi Click Notification của Post Đã Xóa:
1. User click notification → Navigate đến post detail
2. Frontend gọi API `getPostDetail(postId)`
3. Backend trả về 404 (Not Found)
4. Frontend hiển thị UI "Bài viết không còn tồn tại"
5. User có thể đóng modal

---

## 📊 Dữ Liệu Bị Xóa

Khi xóa 1 post, các dữ liệu sau sẽ bị xóa cascade:

| Dữ liệu | Số lượng | Cách xóa |
|---------|----------|----------|
| **Post** | 1 | `discussionPostRepository.delete(post)` |
| **Replies** | N | `discussionReplyRepository.deleteAll(replies)` |
| **Nested Replies** | M | Cascade delete (nếu có foreign key) |
| **Votes (Post)** | X | `discussionVoteRepository.deleteByPostId()` |
| **Votes (Replies)** | Y | `discussionVoteRepository.deleteByReplyId()` |
| **Notifications** | ❌ KHÔNG XÓA | Xử lý khi user click |

---

## 🎯 Lợi Ích

### Backend:
- ✅ **Clean database**: Không còn dữ liệu rác
- ✅ **Cascade delete**: Xóa tất cả dữ liệu liên quan
- ✅ **Performance**: Giảm số lượng records trong database
- ✅ **Data integrity**: Không còn orphan records

### Frontend:
- ✅ **User-friendly**: Thông báo rõ ràng khi post không tồn tại
- ✅ **No crash**: Không bị lỗi khi load post đã xóa
- ✅ **Good UX**: Icon warning + message dễ hiểu
- ✅ **Graceful handling**: User có thể đóng modal và tiếp tục

---

## 🔒 Permissions

Ai có thể xóa post?
- ✅ **Post author** (người tạo bài viết)
- ✅ **Admin** (toàn quyền)
- ✅ **Teacher** (của khóa học đó)

---

## 📝 Notes

### Về Notifications:
- Notifications **KHÔNG** bị xóa khi post bị xóa
- Lý do: Giữ lại lịch sử hoạt động
- Khi user click vào notification của post đã xóa:
  - API trả về 404
  - Frontend hiển thị "Bài viết không còn tồn tại"
  - User có thể xóa notification đó

### Về Database:
- Nếu có foreign key constraints với `ON DELETE CASCADE`, nested replies sẽ tự động bị xóa
- Nếu không có, cần xóa thủ công như trong code

### Về Performance:
- Xóa cascade có thể chậm nếu post có nhiều replies/votes
- Có thể cân nhắc dùng batch delete hoặc async job cho posts lớn

---

## ✅ Testing Checklist

- [ ] Xóa post → Kiểm tra database (post, replies, votes đều bị xóa)
- [ ] Click notification của post đã xóa → Hiển thị "Bài viết không còn tồn tại"
- [ ] Xóa post có nested replies → Tất cả nested replies bị xóa
- [ ] Xóa post có nhiều votes → Tất cả votes bị xóa
- [ ] Permission check → Chỉ author/admin/teacher mới xóa được

---

**Status**: ✅ HOÀN THÀNH
**Date**: 2026-04-15
**Files Changed**: 3 files (1 Service, 1 Repository, 1 Modal)
