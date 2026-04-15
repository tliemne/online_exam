import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { discussionApi } from '../../api/services'
import { useToast } from '../../context/ToastContext'
import { useTranslation } from 'react-i18next'
import CreatePostModal from './modals/CreatePostModal'
import PostDetailModal from './modals/PostDetailModal'

// ── Icons ─────────────────────────────────────────────────
const Icon = {
  plus:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>,
  search:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  like:    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/></svg>,
  dislike: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"/></svg>,
  reply:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>,
  check:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>,
}

export default function DiscussionForumPage({ courseId: propCourseId }) {
  const { courseId: paramCourseId } = useParams()
  const courseId = propCourseId || paramCourseId
  const toast = useToast()
  const { t } = useTranslation()
  
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [search, setSearch] = useState('')

  const loadPosts = () => {
    setLoading(true)
    discussionApi.getPosts(courseId, page, 20)
      .then(r => {
        setPosts(r.data.data.content || [])
        setTotalPages(r.data.data.totalPages || 0)
      })
      .catch(err => toast.error(err.response?.data?.message || 'Không thể tải bài viết'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (courseId) loadPosts()
  }, [courseId, page])

  const handleVote = async (postId, voteType) => {
    try {
      await discussionApi.votePost(postId, voteType)
      loadPosts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể vote')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Diễn đàn thảo luận</h1>
          <p className="text-sm text-[var(--text-3)] mt-1">{posts.length} bài viết</p>
        </div>
        <button onClick={() => setShowCreatePost(true)} className="btn-primary flex items-center gap-2">
          {Icon.plus} Tạo bài viết
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]">{Icon.search}</span>
        <input className="input-field pl-9" placeholder="Tìm kiếm bài viết..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
        </div>
      ) : posts.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-[var(--text-2)]">Chưa có bài viết nào</p>
          <button onClick={() => setShowCreatePost(true)} className="btn-primary mt-4">
            {Icon.plus} Bắt đầu thảo luận
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="card p-5 hover:border-accent/40 transition-colors cursor-pointer"
              onClick={() => setSelectedPost(post)}>
              
              <div className="flex gap-4">
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[var(--text-1)] leading-snug mb-2">{post.title}</h3>
                  <p className="text-sm text-[var(--text-3)] line-clamp-2 mb-3">{post.content}</p>
                  
                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {post.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-[var(--text-3)] mb-2">
                    <span>bởi {post.author?.fullName || post.author?.username}</span>
                    <span className="flex items-center gap-1">
                      {Icon.reply} {post.replyCount || 0} trả lời
                    </span>
                    {post.hasBestAnswer && (
                      <span className="flex items-center gap-1 text-success">
                        {Icon.check} Đã trả lời
                      </span>
                    )}
                  </div>

                  {/* Like/Dislike counts */}
                  {(post.voteCount > 0 || (post.dislikeCount || 0) > 0) && (
                    <div className="flex items-center gap-3 mb-2 text-xs text-[var(--text-3)]">
                      {post.voteCount > 0 && <span>👍 {post.voteCount}</span>}
                      {(post.dislikeCount || 0) > 0 && <span>👎 {post.dislikeCount}</span>}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-base)]">
                    <button onClick={(e) => { e.stopPropagation(); handleVote(post.id, 'UPVOTE') }}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded font-semibold text-sm transition-colors ${
                        post.currentUserVote === 'UPVOTE' 
                          ? 'bg-accent/15 text-accent' 
                          : 'text-[var(--text-3)] hover:bg-accent/10 hover:text-accent'
                      }`}>
                      {Icon.like}
                      Thích
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleVote(post.id, 'DOWNVOTE') }}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded font-semibold text-sm transition-colors ${
                        post.currentUserVote === 'DOWNVOTE' 
                          ? 'bg-danger/15 text-danger' 
                          : 'text-[var(--text-3)] hover:bg-danger/10 hover:text-danger'
                      }`}>
                      {Icon.dislike}
                      Không thích
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="btn-secondary px-4">Trước</button>
          <span className="px-4 py-2 text-sm text-[var(--text-2)]">
            Trang {page + 1} / {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="btn-secondary px-4">Sau</button>
        </div>
      )}

      {/* Modals */}
      {showCreatePost && (
        <CreatePostModal courseId={courseId} onClose={() => setShowCreatePost(false)} onCreated={loadPosts} />
      )}
      {selectedPost && (
        <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} onUpdated={loadPosts} />
      )}
    </div>
  )
}
