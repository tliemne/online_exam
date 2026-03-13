import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { examApi } from '../../api/services'
import api from '../../api/client'
import TakeExamModal      from './modals/TakeExamModal'
import ResultHistoryModal from './modals/ResultHistoryModal'
import StudentExamCard    from './components/StudentExamCard'

export default function StudentExamsPage() {
  const navigate = useNavigate()
  const [exams, setExams]     = useState([])
  const [loading, setLoading] = useState(true)
  const [taking, setTaking]   = useState(null)
  const [viewingResult, setViewingResult] = useState(null)
  const [filter, setFilter]   = useState('all') // all | open | ended

  const load = () => {
    setLoading(true)
    api.get('/exams/student')
      .then(r => setExams(r.data.data || []))
      .catch(() => setExams([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const now = new Date()
  const filtered = exams.filter(e => {
    if (filter === 'open') {
      const s = e.startTime ? new Date(e.startTime) : null
      const end = e.endTime ? new Date(e.endTime) : null
      return (!s || now >= s) && (!end || now <= end)
    }
    if (filter === 'ended') return e.endTime && now > new Date(e.endTime)
    return true
  })

  const openCount  = exams.filter(e => {
    const s = e.startTime ? new Date(e.startTime) : null
    const end = e.endTime ? new Date(e.endTime) : null
    return (!s || now >= s) && (!end || now <= end)
  }).length

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Đề thi</h1>
        <p className="text-[var(--text-2)] text-sm mt-1">Danh sách đề thi dành cho bạn</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tổng đề thi', value: exams.length, color: 'text-accent' },
          { label: 'Đang mở',     value: openCount,    color: 'text-success' },
          { label: 'Đã kết thúc', value: exams.length - openCount, color: 'text-[var(--text-3)]' },
        ].map(s => (
          <div key={s.label} className="card text-center py-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[var(--text-3)] text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all',   label: 'Tất cả' },
          { key: 'open',  label: 'Đang mở' },
          { key: 'ended', label: 'Đã kết thúc' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f.key
                ? 'bg-accent text-white'
                : 'bg-[var(--bg-elevated)] text-[var(--text-3)] hover:text-[var(--text-1)] border border-[var(--border-base)]'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Exam grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          
          <p className="text-[var(--text-2)] font-medium">
            {exams.length === 0 ? 'Chưa có đề thi nào được giao' : 'Không có đề thi nào trong mục này'}
          </p>
          <p className="text-[var(--text-3)] text-sm mt-1">
            {exams.length === 0 ? 'Giáo viên sẽ giao đề thi khi có bài kiểm tra' : ''}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(e => (
            <StudentExamCard key={e.id} exam={e} onTake={setTaking} onViewResult={(ex) => { setViewingResult(ex); }}
              onLeaderboard={(ex) => navigate(`/student/exams/${ex.id}/leaderboard`)} />
          ))}
        </div>
      )}

      {/* Take exam modal */}
      {taking && (
        <TakeExamModal
          exam={taking}
          onClose={() => setTaking(null)}
          onSubmitted={() => { load(); setTaking(null) }}
        />
      )}
      {viewingResult && (
        <ResultHistoryModal exam={viewingResult} onClose={() => setViewingResult(null)} />
      )}
    </div>
  )
}
