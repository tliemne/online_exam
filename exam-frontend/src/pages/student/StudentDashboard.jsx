import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'

const Icon = {
  exams:   <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>,
  results: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"/></svg>,
  course:  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>,
  pass:    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  score:   <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>,
}

function Skeleton({ w = 'w-12', h = 'h-7' }) {
  return <span className={`inline-block rounded animate-pulse ${w} ${h}`}
    style={{ background: 'var(--bg-elevated)' }}/>
}

// Mini donut-style score badge
function ScoreBadge({ score }) {
  if (score == null) return <span style={{ color: 'var(--text-3)' }}>—</span>
  const clr = score >= 8 ? '#16a34a' : score >= 5 ? '#d97706' : '#dc2626'
  return <span className="font-mono font-semibold" style={{ color: clr }}>{score.toFixed(1)}</span>
}

export default function StudentDashboard() {
  const { user }              = useAuth()
  const navigate              = useNavigate()
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    api.get('/dashboard/student')
      .then(r => setStats(r.data.data))
      .catch(e => setError(e?.response?.data?.message || 'Không tải được dữ liệu'))
      .finally(() => setLoading(false))
  }, [])

  const statCards = stats ? [
    { label: 'Lớp đang học',  value: stats.enrolledCourses,   icon: Icon.course,  clr: 'var(--accent)'  },
    { label: 'Đề có thể thi', value: stats.availableExams,    icon: Icon.exams,   clr: '#9333ea'        },
    { label: 'Đã làm bài',   value: stats.completedAttempts,  icon: Icon.results, clr: 'var(--text-2)'  },
    { label: 'Bài đạt',       value: stats.passedAttempts,    icon: Icon.pass,    clr: '#16a34a'        },
    { label: 'Điểm TB',       value: stats.avgScore != null ? stats.avgScore.toFixed(1) : '—', icon: Icon.score, clr: '#d97706' },
  ] : []

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="page-title">Tổng quan</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
          Xin chào, <span style={{ color: 'var(--text-2)' }}>{user?.fullName || user?.username}</span>
        </p>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm border"
          style={{ background: 'rgba(220,38,38,0.06)', borderColor: 'rgba(220,38,38,0.2)', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card p-4 space-y-2">
                <Skeleton w="w-5" h="h-5"/>
                <Skeleton w="w-10" h="h-6"/>
                <Skeleton w="w-16" h="h-3"/>
              </div>
            ))
          : statCards.map(s => (
              <div key={s.label} className="card p-4">
                <div className="mb-2" style={{ color: s.clr }}>{s.icon}</div>
                <div className="font-display font-semibold text-2xl" style={{ color: 'var(--text-1)' }}>{s.value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{s.label}</div>
              </div>
            ))
        }
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/student/exams"
          className="card p-4 hover:border-[var(--border-strong)] transition-colors group">
          <div className="mb-2" style={{ color: 'var(--accent)' }}>{Icon.exams}</div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Bài kiểm tra</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Xem và làm bài thi</p>
        </Link>
        <Link to="/student/results"
          className="card p-4 hover:border-[var(--border-strong)] transition-colors group">
          <div className="mb-2" style={{ color: '#16a34a' }}>{Icon.results}</div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Kết quả của tôi</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Xem điểm và lịch sử thi</p>
        </Link>
      </div>

      {/* Recent attempts */}
      {!loading && stats?.recentAttempts?.length > 0 && (
        <div className="card-bare">
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid var(--border-base)' }}>
            <h2 className="section-title">Bài làm gần đây</h2>
            <Link to="/student/results" className="text-xs" style={{ color: 'var(--accent)' }}>Xem tất cả →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-base)' }}>
                  {['Đề thi', 'Lớp', 'Điểm', 'Kết quả', 'Nộp lúc'].map(h => (
                    <th key={h} className="th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentAttempts.map(a => (
                  <tr key={a.attemptId} className="table-row">
                    <td className="td font-medium" style={{ color: 'var(--text-1)' }}>{a.examTitle}</td>
                    <td className="td" style={{ color: 'var(--text-3)' }}>{a.courseName}</td>
                    <td className="td">
                      <ScoreBadge score={a.score}/>
                      {a.score != null && <span className="text-xs ml-1" style={{ color: 'var(--text-3)' }}>/ {a.totalScore}</span>}
                    </td>
                    <td className="td">
                      {a.status === 'GRADED'
                        ? <span className={a.passed ? 'badge-green' : 'badge-red'}>{a.passed ? 'Đạt' : 'Chưa đạt'}</span>
                        : <span className="badge-amber">Chờ chấm</span>}
                    </td>
                    <td className="td text-xs" style={{ color: 'var(--text-3)' }}>{a.submittedAt || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state nếu chưa thi lần nào */}
      {!loading && stats?.completedAttempts === 0 && (
        <div className="card p-8 text-center">
          <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
            {Icon.exams}
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Bạn chưa làm bài thi nào</p>
          <p className="text-xs mt-1 mb-4" style={{ color: 'var(--text-3)' }}>Vào trang Bài kiểm tra để bắt đầu</p>
          <Link to="/student/exams" className="btn-primary">Xem bài thi</Link>
        </div>
      )}
    </div>
  )
}
