import { useState, useEffect } from 'react'
import { discussionApi } from '../../../api/services'
import { useToast } from '../../../context/ToastContext'
import { useAuth } from '../../../context/AuthContext'
import CreatePostModal from './CreatePostModal'
import ImageGallery from '../../../components/discussion/ImageGallery'
import ImageUploader from '../../../components/discussion/ImageUploader'
import AttachmentToolbar from '../../../components/discussion/AttachmentToolbar'
import FileAttachmentList from '../../../components/discussion/FileAttachmentList'
import FileUploader from '../../../components/discussion/FileUploader'

const Icon = {
  x:       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  like:    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/></svg>,
  dislike: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"/></svg>,
  comment: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>,
  check:   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  edit:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>,
  trash:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
  chevronDown: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>,
  chevronUp: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg>,
}

// Recursive Reply Component
function ReplyItem({ reply, post, user, isAdmin, isTeacher, isAuthor, canMarkBestAnswer, onVote, onEdit, onDelete, onMarkBest, onReply, level = 0 }) {
  const [editMode, setEditMode] = useState(false)
  const [editContent, setEditContent] = useState(reply.content)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [replyImages, setReplyImages] = useState([])
  const [replyFiles, setReplyFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [showNested, setShowNested] = useState(true)
  const toast = useToast()

  const handleSaveEdit = async () => {
    try {
      await discussionApi.updateReply(reply.id, { content: editContent })
      setEditMode(false)
      onEdit()
      toast.success('Đã cập nhật bình luận')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật')
    }
  }

  const handleSubmitReply = async (e) => {
    e.preventDefault()
    if (replyContent.length < 1) {
      toast.error('Nội dung không được để trống')
      return
    }
    setSubmitting(true)
    try {
      const response = await discussionApi.createReply(post.id, { content: replyContent, parentReplyId: reply.id })
      const newReplyId = response.data.data.id

      // Upload images if any
      if (replyImages.length > 0 && newReplyId) {
        const uploadPromises = replyImages.map(img => 
          discussionApi.uploadReplyAttachment(newReplyId, img.file)
        )
        await Promise.all(uploadPromises)
      }

      // Upload files if any
      if (replyFiles.length > 0 && newReplyId) {
        const uploadPromises = replyFiles.map(file => 
          discussionApi.uploadReplyAttachment(newReplyId, file.file)
        )
        await Promise.all(uploadPromises)
      }

      setReplyContent('')
      setReplyImages([])
      setReplyFiles([])
      setShowReplyForm(false)
      onReply()
      toast.success('Đã đăng trả lời')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể đăng trả lời')
    } finally {
      setSubmitting(false)
    }
  }

  // Get direct children
  const nestedReplies = post.replies?.filter(r => r.parentReplyId === reply.id) || []
  const hasNested = nestedReplies.length > 0

  // Calculate indent and background based on level
  const marginLeft = level > 0 ? `${Math.min(level * 32, 128)}px` : '0'
  const bgColor = level % 2 === 0 ? 'bg-[var(--bg-page)]' : 'bg-[var(--bg-elevated)]'

  return (
    <div style={{ marginLeft }} className={`${bgColor} ${level > 0 ? 'pt-3' : ''}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className={`${level > 0 ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'} rounded-full bg-accent/10 flex items-center justify-center shrink-0 font-bold text-accent`}>
          {(reply.author?.fullName || reply.author?.username || '?')[0].toUpperCase()}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className={`rounded-2xl px-4 py-2.5 inline-block max-w-full ${
            reply.isBestAnswer ? 'bg-success/10 border border-success/30' : level === 0 ? 'bg-[var(--bg-elevated)]' : 'bg-[var(--bg-page)]'
          }`}>
            <div className="font-semibold text-sm text-[var(--text-1)] mb-1">
              {reply.author?.fullName || reply.author?.username}
              {reply.isBestAnswer && (
                <span className="ml-2 text-xs text-success">✓ Câu trả lời tốt nhất</span>
              )}
            </div>
            {editMode ? (
              <div className="space-y-2">
                <textarea className="input-field resize-none text-sm" rows={3} value={editContent}
                  onChange={e => setEditContent(e.target.value)} placeholder="Chỉnh sửa..." />
                <div className="flex gap-2">
                  <button onClick={handleSaveEdit} className="btn-primary px-4 py-1 text-sm">Lưu</button>
                  <button onClick={() => setEditMode(false)} className="btn-secondary px-4 py-1 text-sm">Hủy</button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-2)] whitespace-pre-wrap break-words">{reply.content}</p>
            )}
          </div>

          {/* Reply Images */}
          <ImageGallery 
            attachments={reply.attachments} 
            canDelete={user?.id === reply.author?.id || isAdmin}
            onDelete={onEdit}
          />

          {/* Reply Files */}
          <FileAttachmentList 
            attachments={reply.attachments} 
            canDelete={user?.id === reply.author?.id || isAdmin}
            onDelete={onEdit}
          />

          {/* Like/Dislike counts */}
          {(reply.voteCount > 0 || (reply.dislikeCount || 0) > 0) && (
            <div className="flex items-center gap-2 mt-1 px-2 text-xs text-[var(--text-3)]">
              {reply.voteCount > 0 && <span>👍 {reply.voteCount}</span>}
              {(reply.dislikeCount || 0) > 0 && <span>👎 {reply.dislikeCount}</span>}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mt-1 px-2 text-xs border-t border-[var(--border-base)] pt-1 flex-wrap">
            <button onClick={() => onVote(reply.id, 'UPVOTE')}
              className={`flex items-center gap-1 font-semibold transition-colors py-1 ${
                reply.currentUserVote === 'UPVOTE' ? 'text-accent' : 'text-[var(--text-3)] hover:text-accent'
              }`}>
              Thích
            </button>
            <button onClick={() => onVote(reply.id, 'DOWNVOTE')}
              className={`flex items-center gap-1 font-semibold transition-colors py-1 ${
                reply.currentUserVote === 'DOWNVOTE' ? 'text-danger' : 'text-[var(--text-3)] hover:text-danger'
              }`}>
              Không thích
            </button>
            <button onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1 font-semibold text-[var(--text-3)] hover:text-accent transition-colors py-1">
              Trả lời
            </button>
            {canMarkBestAnswer && level === 0 && (
              <button onClick={() => onMarkBest(reply.id)}
                className={`flex items-center gap-1 font-semibold transition-colors py-1 ${
                  reply.isBestAnswer 
                    ? 'text-success hover:text-danger' 
                    : 'text-[var(--text-3)] hover:text-success'
                }`}>
                {reply.isBestAnswer ? 'Hủy đánh dấu' : 'Đánh dấu tốt nhất'}
              </button>
            )}
            {(user?.id === reply.author?.id || isAdmin) && (
              <button onClick={() => setEditMode(true)}
                className="flex items-center gap-1 font-semibold text-[var(--text-3)] hover:text-accent transition-colors py-1">
                Sửa
              </button>
            )}
            {(user?.id === reply.author?.id || isAuthor || isAdmin || isTeacher) && (
              <button onClick={() => onDelete(reply.id)}
                className="flex items-center gap-1 font-semibold text-[var(--text-3)] hover:text-danger transition-colors py-1">
                Xóa
              </button>
            )}
            <span className="text-[var(--text-3)] ml-auto">
              {new Date(reply.createdAt).toLocaleDateString('vi-VN')}
            </span>
          </div>

          {/* Inline Reply Form */}
          {showReplyForm && (
            <div className="mt-3 bg-[var(--bg-elevated)] rounded-lg p-3">
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 font-bold text-accent text-xs">
                  {(user?.fullName || user?.username || '?')[0].toUpperCase()}
                </div>
                
                {/* Form */}
                <form onSubmit={handleSubmitReply} className="flex-1 space-y-3">
                  <div className="relative">
                    <textarea 
                      className="input-field resize-none pr-12 text-sm" 
                      rows={2} 
                      value={replyContent}
                      onChange={e => setReplyContent(e.target.value)}
                      placeholder={`Trả lời ${reply.author?.fullName || reply.author?.username}...`}
                      maxLength={5000}
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={submitting || replyContent.length < 1}
                      className="absolute right-2 bottom-2 p-1 text-accent hover:bg-accent/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Đăng"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                      </svg>
                    </button>
                  </div>
                  
                  {/* Toolbar */}
                  <div className="flex items-center justify-between">
                    <AttachmentToolbar 
                      onImageSelect={(files) => {
                        const newImages = files.map(file => ({
                          file,
                          preview: URL.createObjectURL(file),
                          name: file.name,
                          size: file.size,
                        }))
                        setReplyImages(prev => [...prev, ...newImages].slice(0, 3))
                      }}
                      onFileSelect={(files) => {
                        const newFiles = files.map(file => ({
                          file,
                          name: file.name,
                          size: file.size,
                        }))
                        setReplyFiles(prev => [...prev, ...newFiles].slice(0, 1))
                      }}
                      imageDisabled={replyImages.length >= 3}
                      fileDisabled={replyFiles.length >= 1}
                    />
                    <span className="text-xs text-[var(--text-3)]">{replyContent.length}/5000</span>
                  </div>

                  {/* Image Preview */}
                  {replyImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {replyImages.map((img, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-[var(--bg-page)] border border-[var(--border-base)]">
                          <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setReplyImages(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 p-1 rounded-full bg-danger text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* File Preview */}
                  {replyFiles.length > 0 && (
                    <div className="space-y-2">
                      {replyFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-page)] border border-[var(--border-base)] group">
                          <div className="text-accent">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[var(--text-1)] truncate">{file.name}</p>
                            <p className="text-xs text-[var(--text-3)]">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReplyFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1 rounded-full hover:bg-danger/10 text-danger transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* Toggle nested replies */}
          {hasNested && (
            <button onClick={() => setShowNested(!showNested)}
              className="mt-2 px-2 text-xs font-semibold text-accent hover:underline">
              {showNested ? `Ẩn ${nestedReplies.length} phản hồi` : `Xem ${nestedReplies.length} phản hồi`}
            </button>
          )}
        </div>
      </div>

      {/* Nested Replies (Recursive) */}
      {showNested && nestedReplies.map(nested => (
        <ReplyItem
          key={nested.id}
          reply={nested}
          post={post}
          user={user}
          isAdmin={isAdmin}
          isTeacher={isTeacher}
          isAuthor={isAuthor}
          canMarkBestAnswer={canMarkBestAnswer}
          onVote={onVote}
          onEdit={onEdit}
          onDelete={onDelete}
          onMarkBest={onMarkBest}
          onReply={onReply}
          level={level + 1}
        />
      ))}
    </div>
  )
}

export default function PostDetailModal({ post: initialPost, onClose, onUpdated }) {
  const toast = useToast()
  const { user } = useAuth()
  const [post, setPost] = useState(initialPost)
  const [replyContent, setReplyContent] = useState('')
  const [replyImages, setReplyImages] = useState([])
  const [replyFiles, setReplyFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showEditPost, setShowEditPost] = useState(false)
  const [postNotFound, setPostNotFound] = useState(false)
  const [showComments, setShowComments] = useState(true)
  const [showReplyForm, setShowReplyForm] = useState(false)

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

  useEffect(() => {
    loadPost()
  }, [initialPost.id])

  const handleVotePost = async (voteType) => {
    try {
      await discussionApi.votePost(post.id, voteType)
      loadPost()
      onUpdated()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể vote')
    }
  }

  const handleVoteReply = async (replyId, voteType) => {
    try {
      await discussionApi.voteReply(replyId, voteType)
      loadPost()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể vote')
    }
  }

  const handleSubmitReply = async (e) => {
    e.preventDefault()
    if (replyContent.length < 1) {
      toast.error('Bình luận không được để trống')
      return
    }
    setSubmitting(true)
    try {
      const response = await discussionApi.createReply(post.id, { content: replyContent })
      const newReplyId = response.data.data.id

      // Upload images if any
      if (replyImages.length > 0 && newReplyId) {
        const uploadPromises = replyImages.map(img => 
          discussionApi.uploadReplyAttachment(newReplyId, img.file)
        )
        await Promise.all(uploadPromises)
      }

      // Upload files if any
      if (replyFiles.length > 0 && newReplyId) {
        const uploadPromises = replyFiles.map(file => 
          discussionApi.uploadReplyAttachment(newReplyId, file.file)
        )
        await Promise.all(uploadPromises)
      }

      setReplyContent('')
      setReplyImages([])
      setReplyFiles([])
      setShowReplyForm(false)
      loadPost()
      toast.success('Đã đăng bình luận')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể đăng bình luận')
    } finally {
      setSubmitting(false)
    }
  }

  const handleImageSelect = (files) => {
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
    }))
    setReplyImages(prev => [...prev, ...newImages].slice(0, 3))
  }

  const handleFileSelect = (files) => {
    const newFiles = files.map(file => ({
      file,
      name: file.name,
      size: file.size,
    }))
    setReplyFiles(prev => [...prev, ...newFiles].slice(0, 1))
  }

  const handleMarkBestAnswer = async (replyId) => {
    try {
      // Check if this reply is already best answer
      const reply = post.replies?.find(r => r.id === replyId)
      if (reply?.isBestAnswer) {
        // Unmark best answer
        await discussionApi.unmarkBestAnswer(post.id)
        toast.success('Đã hủy đánh dấu câu trả lời tốt nhất')
      } else {
        // Mark as best answer
        await discussionApi.markBestAnswer(post.id, replyId)
        toast.success('Đã đánh dấu câu trả lời tốt nhất')
      }
      loadPost()
      onUpdated()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể thực hiện')
    }
  }

  const handleDeletePost = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) return
    try {
      await discussionApi.deletePost(post.id)
      toast.success('Đã xóa bài viết')
      onUpdated()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa')
    }
  }

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return
    try {
      await discussionApi.deleteReply(replyId)
      loadPost()
      toast.success('Đã xóa bình luận')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa')
    }
  }

  const isAuthor = user?.id === post.author?.id
  const isAdmin = user?.roles?.includes('ADMIN')
  const isTeacher = user?.roles?.includes('TEACHER')
  const canEditPost = isAuthor || isAdmin
  const canDeletePost = isAuthor || isAdmin || isTeacher
  const canMarkBestAnswer = isAuthor || isAdmin || isTeacher

  const mainReplies = post.replies?.filter(r => !r.parentReplyId) || []

  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-4xl max-h-[90vh] flex flex-col">
        <div className="modal-header shrink-0">
          <h2 className="section-title">Thảo luận</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">{Icon.x}</button>
        </div>

        {/* Post not found */}
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
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Post */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-xl font-bold text-[var(--text-1)]">{post.title}</h2>
                {(canEditPost || canDeletePost) && (
                  <div className="flex items-center gap-2">
                    {canEditPost && (
                      <button onClick={() => setShowEditPost(true)}
                        className="p-1.5 rounded hover:bg-accent/10 text-[var(--text-3)] hover:text-accent transition-colors">
                        {Icon.edit}
                      </button>
                    )}
                    {canDeletePost && (
                      <button onClick={handleDeletePost}
                        className="p-1.5 rounded hover:bg-danger/10 text-[var(--text-3)] hover:text-danger transition-colors">
                        {Icon.trash}
                      </button>
                    )}
                  </div>
                )}
              </div>
              <p className="text-[var(--text-2)] whitespace-pre-wrap mb-4">{post.content}</p>
              
              {/* Post Images */}
              <ImageGallery 
                attachments={post.attachments} 
                canDelete={canEditPost}
                onDelete={loadPost}
              />

              {/* Post Files */}
              <FileAttachmentList 
                attachments={post.attachments} 
                canDelete={canEditPost}
                onDelete={loadPost}
              />

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {post.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-sm text-[var(--text-3)] mb-3">
                Đăng bởi <span className="font-medium text-[var(--text-2)]">{post.author?.fullName || post.author?.username}</span>
              </div>

              {/* Like/Dislike counts */}
              {(post.voteCount > 0 || (post.dislikeCount || 0) > 0) && (
                <div className="flex items-center gap-3 mb-2 text-sm text-[var(--text-3)]">
                  {post.voteCount > 0 && <span>👍 {post.voteCount}</span>}
                  {(post.dislikeCount || 0) > 0 && <span>👎 {post.dislikeCount}</span>}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 py-2 border-y border-[var(--border-base)]">
                <button onClick={() => handleVotePost('UPVOTE')}
                  className={`flex items-center gap-2 font-semibold transition-colors py-1 px-3 rounded ${
                    post.currentUserVote === 'UPVOTE' 
                      ? 'text-accent bg-accent/10' 
                      : 'text-[var(--text-3)] hover:bg-accent/10 hover:text-accent'
                  }`}>
                  {Icon.like}
                  Thích
                </button>
                <button onClick={() => setShowReplyForm(!showReplyForm)}
                  className={`flex items-center gap-2 font-semibold transition-colors py-1 px-3 rounded ${
                    showReplyForm
                      ? 'text-accent bg-accent/10'
                      : 'text-[var(--text-3)] hover:bg-accent/10 hover:text-accent'
                  }`}>
                  {Icon.comment}
                  Bình luận
                </button>
                <button onClick={() => handleVotePost('DOWNVOTE')}
                  className={`flex items-center gap-2 font-semibold transition-colors py-1 px-3 rounded ${
                    post.currentUserVote === 'DOWNVOTE' 
                      ? 'text-danger bg-danger/10' 
                      : 'text-[var(--text-3)] hover:bg-danger/10 hover:text-danger'
                  }`}>
                  {Icon.dislike}
                  Không thích
                </button>
              </div>

              {/* Reply Form - Show at top when button clicked */}
              {showReplyForm && (
                <div className="mt-4 bg-[var(--bg-elevated)] rounded-lg p-4">
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0 font-bold text-accent">
                      {(user?.fullName || user?.username || '?')[0].toUpperCase()}
                    </div>
                    
                    {/* Form */}
                    <form onSubmit={handleSubmitReply} className="flex-1 space-y-3">
                      <div className="relative">
                        <textarea 
                          className="input-field resize-none pr-12" 
                          rows={2} 
                          value={replyContent}
                          onChange={e => setReplyContent(e.target.value)}
                          placeholder={`Bình luận dưới tên ${user?.fullName || user?.username}...`}
                          maxLength={5000} 
                          autoFocus 
                        />
                        <button
                          type="submit"
                          disabled={submitting || replyContent.length < 1}
                          className="absolute right-2 bottom-2 p-1.5 text-accent hover:bg-accent/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Đăng"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                          </svg>
                        </button>
                      </div>
                      
                      {/* Toolbar and Images */}
                      <div className="flex items-center justify-between">
                        <AttachmentToolbar 
                          onImageSelect={handleImageSelect}
                          onFileSelect={handleFileSelect}
                          imageDisabled={replyImages.length >= 3}
                          fileDisabled={replyFiles.length >= 1}
                        />
                        <span className="text-xs text-[var(--text-3)]">{replyContent.length}/5000</span>
                      </div>

                      {/* Image Preview */}
                      {replyImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {replyImages.map((img, idx) => (
                            <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-[var(--bg-page)] border border-[var(--border-base)]">
                              <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setReplyImages(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute top-1 right-1 p-1 rounded-full bg-danger text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* File Preview */}
                      {replyFiles.length > 0 && (
                        <div className="space-y-2">
                          {replyFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-page)] border border-[var(--border-base)] group">
                              <div className="text-accent">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-[var(--text-1)] truncate">{file.name}</p>
                                <p className="text-xs text-[var(--text-3)]">{(file.size / 1024).toFixed(1)} KB</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setReplyFiles(prev => prev.filter((_, i) => i !== idx))}
                                className="p-1 rounded-full hover:bg-danger/10 text-danger transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-[var(--border-base)] pt-4">
            {/* Comments Header with Toggle */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text-1)]">{post.replyCount || 0} Bình luận</h3>
              {(post.replyCount || 0) > 0 && (
                <button 
                  onClick={() => setShowComments(!showComments)}
                  className="flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                  {showComments ? (
                    <>{Icon.chevronUp} Thu gọn</>
                  ) : (
                    <>{Icon.chevronDown} Xem tất cả</>
                  )}
                </button>
              )}
            </div>

            {/* Replies */}
            {showComments && (
              <div className="space-y-4">
                {mainReplies.length > 0 ? (
                  mainReplies.map(reply => (
                    <ReplyItem
                      key={reply.id}
                      reply={reply}
                      post={post}
                      user={user}
                      isAdmin={isAdmin}
                      isTeacher={isTeacher}
                      isAuthor={isAuthor}
                      canMarkBestAnswer={canMarkBestAnswer}
                      onVote={handleVoteReply}
                      onEdit={loadPost}
                      onDelete={handleDeleteReply}
                      onMarkBest={handleMarkBestAnswer}
                      onReply={loadPost}
                      level={0}
                    />
                  ))
                ) : (
                  <p className="text-center text-[var(--text-3)] py-8">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                )}
              </div>
            )}
          </div>
        </div>
        )}
      </div>
      
      {showEditPost && (
        <CreatePostModal
          courseId={post.courseId}
          post={post}
          onClose={() => setShowEditPost(false)}
          onCreated={() => {
            setShowEditPost(false)
            loadPost()
            onUpdated()
          }}
        />
      )}
    </div>
  )
}
