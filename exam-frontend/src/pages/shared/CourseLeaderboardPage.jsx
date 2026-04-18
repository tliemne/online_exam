import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { courseApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'

// ── Icons ─────────────────────────────────────────────────
const Icon = {
  back: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>,
  exam: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>,
  trophy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"/></svg>,
  chart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>,
  search:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"/></svg>,
}

function RankBadge({ rank }) {
  const s =
    rank === 1 ? 'bg-yellow-500/15 border border-yellow-500/30 text-yellow-500 font-bold' :
    rank === 2 ? 'bg-slate-400/15 border border-slate-400/30 text-slate-400 font-bold'    :
    rank === 3 ? 'bg-orange-700/15 border border-orange-700/30 text-orange-600 font-bold' :
                 'bg-[var(--bg-elevated)] text-[var(--text-3)] font-medium'
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${s}`}>
      {rank}
    </div>
  )
}

function ScoreBar({ value }) {
  const color = value >= 80 ? '#22c55e' : value >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-2.5 min-w-[120px]">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold tabular-nums w-10 text-right" style={{ color }}>
        {value.toFixed(1)}%
      </span>
    </div>
  )
}

function Podium({ ranking, myId }) {
  if (ranking.length < 2) return null
  const top   = ranking.slice(0, 3)
  const slots = [
    { entry: top[1], place: 2, height: 'h-14', color: 'text-slate-400',  ring: 'ring-slate-400/30'  },
    { entry: top[0], place: 1, height: 'h-20', color: 'text-yellow-500', ring: 'ring-yellow-500/40' },
    { entry: top[2], place: 3, height: 'h-10', color: 'text-orange-600', ring: 'ring-orange-600/30' },
  ].filter(s => s.entry)

  return (
    <div className="card p-6 rounded-xl">
      <p className="text-xs font-medium text-[var(--text-3)] uppercase tracking-wider mb-6 text-center">
        Xếp hạng cao nhất
      </p>
      <div className="flex items-end justify-center gap-3">
        {slots.map(({ entry, place, height, color, ring }) => {
          const isMe = entry.studentId === myId
          return (
            <div key={entry.studentId} className="flex flex-col items-center gap-2 w-28">
              <div className={`w-10 h-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-sm font-semibold text-[var(--text-1)] ring-2 ${isMe ? 'ring-[var(--accent)]' : ring}`}>
                {entry.studentName?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-[var(--text-1)] line-clamp-2">{entry.studentName}</p>
                {isMe && <p className="text-xs text-[var(--accent)] mt-0.5">bạn</p>}
                <p className={`text-xs font-semibold mt-0.5 ${color}`}>{entry.avgScore.toFixed(1)}%</p>
              </div>
              <div className={`w-full ${height} rounded-t border-t border-x border-[var(--border)] bg-[var(--bg-1)] flex items-start justify-center pt-1.5`}>
                <span className={`text-xs font-bold ${color}`}>#{place}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function CourseLeaderboardPage() {
  const { courseId } = useParams()
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const pageSize = 10

  const loadData = (pageNum = 0) => {
    setLoading(true)
    courseApi.getLeaderboard(courseId, pageNum, pageSize)
      .then(r => {
        const responseData = r.data.data
        if (responseData && typeof responseData === 'object' && responseData.content) {
          // Paginated response
          setData(responseData.content[0]) // The actual leaderboard data
          setTotalPages(responseData.totalPages || 0)
          setPage(pageNum)
        } else {
          // Legacy non-paginated response
          setData(responseData)
          setTotalPages(1)
          setPage(0)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData(0) }, [courseId])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"/>
    </div>
  )
  if (!data) return <div className="py-12 text-center text-[var(--text-3)] text-sm">Không tải được dữ liệu</div>

  const myEntry  = data.ranking?.find(e => e.studentId === user?.id)
  const filtered = (data.ranking ?? []).filter(e =>
    e.studentName?.toLowerCase().includes(search.toLowerCase()) ||
    e.studentCode?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors mb-3">
          {Icon.back} Quay lại
        </button>
        <h1 className="page-title">Bảng xếp hạng lớp</h1>
        <p className="text-[var(--text-3)] text-sm mt-1">{data.courseName}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Sinh viên đã thi', value: data.totalStudents,             icon: Icon.users,  color: 'text-blue-400'          },
          { label: 'Đề thi trong lớp', value: data.totalExams,               icon: Icon.exam,   color: 'text-purple-400'        },
          { label: 'Vị trí của bạn',   value: myEntry ? `#${myEntry.rank}` : '—', icon: Icon.trophy, color: 'text-[var(--accent)]'   },
        ].map((s, i) => (
          <div key={i} className="card p-4 rounded-xl">
            <div className={`mb-2.5 ${s.color}`}>{s.icon}</div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[var(--text-3)] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* My rank */}
      {myEntry && (
        <div className="card p-5 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5">
          <p className="text-xs font-medium text-[var(--text-3)] uppercase tracking-wider mb-3">Kết quả của bạn</p>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold text-[var(--text-1)]">{myEntry.studentName}</p>
              <p className="text-xs text-[var(--text-3)] mt-0.5">{myEntry.studentCode}</p>
              <div className="flex items-center gap-4 mt-2.5 text-sm text-[var(--text-3)]">
                <span>Đã thi: <span className="text-[var(--text-1)] font-medium">{myEntry.examsTaken}</span></span>
                <span>Đạt: <span className="text-green-400 font-medium">{myEntry.examsPasssed}</span></span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-[var(--text-1)]">
                  {myEntry.avgScore.toFixed(1)}<span className="text-base font-normal text-[var(--text-3)]">%</span>
                </p>
                <p className="text-xs text-[var(--text-3)] mt-0.5">điểm TB</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[var(--accent)]">#{myEntry.rank}</p>
                <p className="text-xs text-[var(--text-3)] mt-0.5">xếp hạng</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Podium */}
      {data.ranking?.length >= 2 && <Podium ranking={data.ranking} myId={user?.id} />}

      {/* Table */}
      <div className="card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[var(--text-2)]">
            {Icon.chart}
            <span className="font-medium text-[var(--text-1)]">Toàn bộ xếp hạng</span>
            <span className="text-sm text-[var(--text-3)]">({data.ranking?.length ?? 0} sinh viên)</span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]">{Icon.search}</span>
            <input
              type="text"
              placeholder="Tìm tên hoặc mã SV..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9 text-sm w-52"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-[var(--text-3)] text-sm">
            {search ? 'Không tìm thấy sinh viên phù hợp' : 'Chưa có dữ liệu thi trong lớp'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--bg-1)]">
                {['Hạng', 'Sinh viên', 'Bài thi', 'Điểm TB', 'Đạt / Tổng', 'Bài thi gần nhất'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-[var(--text-3)] font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map(entry => {
                const isMe = entry.studentId === user?.id
                return (
                  <tr key={entry.studentId} className={`transition-colors ${isMe ? 'bg-[var(--accent)]/8' : 'hover:bg-[var(--bg-1)]'}`}>
                    <td className="px-4 py-3"><RankBadge rank={entry.rank} /></td>
                    <td className="px-4 py-3">
                      <p className={`text-[var(--text-1)] ${isMe ? 'font-semibold' : ''}`}>
                        {entry.studentName}
                        {isMe && <span className="ml-1.5 text-xs text-[var(--accent)] font-normal">bạn</span>}
                      </p>
                      <p className="text-xs text-[var(--text-3)] mt-0.5">{entry.studentCode}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-2)] tabular-nums">{entry.examsTaken}</td>
                    <td className="px-4 py-3"><ScoreBar value={entry.avgScore} /></td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className="text-green-400 font-medium">{entry.examsPasssed}</span>
                      <span className="text-[var(--text-3)]"> / {entry.examsTaken}</span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-3)] text-xs max-w-[200px] truncate">
                      {entry.lastExamTitle || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(page - 1)}
              disabled={page === 0}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: 'var(--bg-elevated)', 
                color: 'var(--text-2)',
                border: '1px solid var(--border-base)'
              }}>
              ← Trước
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(0, Math.min(totalPages - 5, page - 2)) + i
              if (pageNum >= totalPages) return null
              return (
                <button
                  key={pageNum}
                  onClick={() => loadData(pageNum)}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  style={pageNum === page
                    ? { background: 'var(--accent)', color: '#fff' }
                    : { background: 'var(--bg-elevated)', color: 'var(--text-2)', border: '1px solid var(--border-base)' }}>
                  {pageNum + 1}
                </button>
              )
            })}
            
            <button
              onClick={() => loadData(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: 'var(--bg-elevated)', 
                color: 'var(--text-2)',
                border: '1px solid var(--border-base)'
              }}>
              Sau →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
