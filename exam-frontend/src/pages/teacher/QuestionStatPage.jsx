import { useState, useEffect } from 'react'
import { courseApi } from '../../api/services'
import api from '../../api/client'

const FLAG_META = {
  TOO_EASY: { label: 'Quá dễ',  cls: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' },
  TOO_HARD: { label: 'Quá khó', cls: 'bg-red-500/15 text-red-400 border border-red-500/30' },
  OK:       { label: 'Bình thường', cls: 'bg-green-500/15 text-green-400 border border-green-500/30' },
}
const DIFF_META = {
  EASY:   { label: 'Dễ',   cls: 'text-green-400' },
  MEDIUM: { label: 'TB',   cls: 'text-blue-400'  },
  HARD:   { label: 'Khó',  cls: 'text-red-400'   },
}
const TYPE_META = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  TRUE_FALSE:      'Đúng/Sai',
  ESSAY:           'Tự luận',
}

function CorrectRateBar({ rate }) {
  const pct = Math.round(rate * 100)
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#eab308' : '#ef4444'
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-mono w-10 text-right shrink-0" style={{ color }}>{pct}%</span>
    </div>
  )
}

export default function QuestionStatPage() {
  const [courses, setCourses]   = useState([])
  const [courseId, setCourseId] = useState('')
  const [stats, setStats]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [flagFilter, setFlagFilter] = useState('ALL') // ALL | OK | TOO_EASY | TOO_HARD
  const [sortBy, setSortBy]     = useState('rate_asc') // rate_asc | rate_desc | attempts

  useEffect(() => {
    courseApi.getAll()
      .then(r => {
        const list = r.data.data || []
        setCourses(list)
        if (list.length > 0) setCourseId(String(list[0].id))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!courseId) return
    setLoading(true)
    api.get(`/questions/stats/course/${courseId}`)
      .then(r => setStats(r.data.data || []))
      .catch(() => setStats([]))
      .finally(() => setLoading(false))
  }, [courseId])

  const filtered = stats
    .filter(s => flagFilter === 'ALL' || s.difficultyFlag === flagFilter)
    .sort((a, b) => {
      if (sortBy === 'rate_asc')  return a.correctRate - b.correctRate
      if (sortBy === 'rate_desc') return b.correctRate - a.correctRate
      return b.totalAttempts - a.totalAttempts
    })

  const tooHard = stats.filter(s => s.difficultyFlag === 'TOO_HARD').length
  const tooEasy = stats.filter(s => s.difficultyFlag === 'TOO_EASY').length
  const avgRate  = stats.length ? Math.round(stats.reduce((s, q) => s + q.correctRate, 0) / stats.length * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Thống kê câu hỏi</h1>
          <p className="page-subtitle">Tỷ lệ đúng/sai · Phát hiện câu quá dễ hoặc quá khó</p>
        </div>
        <select className="input-field w-56" value={courseId} onChange={e => setCourseId(e.target.value)}>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Summary cards */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card text-center">
            <div className="text-2xl font-bold text-[var(--text-1)]">{stats.length}</div>
            <div className="text-xs text-[var(--text-3)] mt-1">Câu hỏi có dữ liệu</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-[var(--accent)]">{avgRate}%</div>
            <div className="text-xs text-[var(--text-3)] mt-1">Tỷ lệ đúng TB</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-red-400">{tooHard}</div>
            <div className="text-xs text-[var(--text-3)] mt-1">Câu quá khó (&lt;30%)</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-yellow-400">{tooEasy}</div>
            <div className="text-xs text-[var(--text-3)] mt-1">Câu quá dễ (&gt;85%)</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-1 bg-[var(--bg-elevated)] border border-[var(--border-base)] rounded-lg p-1">
          {[['ALL','Tất cả'], ['OK','Bình thường'], ['TOO_HARD','Quá khó'], ['TOO_EASY','Quá dễ']].map(([v, l]) => (
            <button key={v} onClick={() => setFlagFilter(v)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                flagFilter === v ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
              }`}>{l}
            </button>
          ))}
        </div>
        <select className="input-field w-44 text-sm" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="rate_asc">Tỷ lệ đúng ↑</option>
          <option value="rate_desc">Tỷ lệ đúng ↓</option>
          <option value="attempts">Nhiều lần nhất</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin"/>
        </div>
      ) : !courseId ? (
        <div className="card text-center py-16 text-[var(--text-3)]">Chọn lớp học để xem thống kê</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-[var(--text-3)]">
            {stats.length === 0
              ? 'Chưa có dữ liệu — câu hỏi cần được làm ít nhất 5 lần để hiện thống kê'
              : 'Không có câu hỏi nào khớp filter'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-base)] bg-[var(--bg-elevated)]">
                <th className="text-left px-4 py-3 text-[var(--text-3)] font-medium w-8">#</th>
                <th className="text-left px-4 py-3 text-[var(--text-3)] font-medium">Câu hỏi</th>
                <th className="text-center px-3 py-3 text-[var(--text-3)] font-medium w-24">Loại</th>
                <th className="text-center px-3 py-3 text-[var(--text-3)] font-medium w-16">Độ khó</th>
                <th className="text-center px-3 py-3 text-[var(--text-3)] font-medium w-20">Lần TL</th>
                <th className="text-left px-4 py-3 text-[var(--text-3)] font-medium w-48">Tỷ lệ đúng</th>
                <th className="text-center px-3 py-3 text-[var(--text-3)] font-medium w-28">Đánh giá</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q, i) => {
                const flag = FLAG_META[q.difficultyFlag] || FLAG_META.OK
                const diff = DIFF_META[q.difficulty] || {}
                return (
                  <tr key={q.questionId} className="border-b border-[var(--border-base)] hover:bg-[var(--bg-elevated)] transition-colors">
                    <td className="px-4 py-3 text-[var(--text-3)] text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="text-[var(--text-1)] line-clamp-2">{q.questionContent}</p>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-xs text-[var(--text-3)]">{TYPE_META[q.questionType] || q.questionType}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs font-medium ${diff.cls}`}>{diff.label}</span>
                    </td>
                    <td className="px-3 py-3 text-center text-[var(--text-2)] font-mono text-xs">{q.totalAttempts}</td>
                    <td className="px-4 py-3"><CorrectRateBar rate={q.correctRate} /></td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${flag.cls}`}>{flag.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
