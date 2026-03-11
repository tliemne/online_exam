import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'

const Icon = {
  course:   <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>,
  exam:     <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>,
  grading:  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"/></svg>,
  attempts: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>,
  pass:     <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  question: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/></svg>,
  arrow:    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L19.5 10.5m0 0L13.5 16.5m6-6H4.5"/></svg>,
}

const QuickLinks = [
  { to: '/teacher/courses',   label: 'Lớp học',       desc: 'Tạo lớp, quản lý sinh viên', icon: Icon.course   },
  { to: '/teacher/questions', label: 'Ngân hàng câu', desc: 'Thêm và phân loại câu hỏi',  icon: Icon.question },
  { to: '/teacher/exams',     label: 'Bài kiểm tra',  desc: 'Tạo đề thi, giao cho lớp',   icon: Icon.exam     },
  { to: '/teacher/grading',   label: 'Chấm điểm',     desc: 'Chấm bài tự luận còn tồn',   icon: Icon.grading  },
]

function Skeleton({ w = 'w-12', h = 'h-7' }) {
  return <span className={`inline-block rounded animate-pulse ${w} ${h}`}
    style={{ background: 'var(--bg-elevated)' }}/>
}

export default function TeacherDashboard() {
  const { user }              = useAuth()
  const navigate              = useNavigate()
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    api.get('/dashboard/teacher')
      .then(r => setStats(r.data.data))
      .catch(e => setError(e?.response?.data?.message || 'Không tải được dữ liệu'))
      .finally(() => setLoading(false))
  }, [])

  const statCards = stats ? [
    { label: 'Lớp của tôi',    value: stats.myCourses,      icon: Icon.course,    clr: 'var(--accent)' },
    { label: 'Đề thi',         value: stats.myExams,        icon: Icon.exam,      clr: '#9333ea'       },
    { label: 'Đề đang mở',     value: stats.publishedExams, icon: Icon.pass,      clr: '#16a34a'       },
    { label: 'Chờ chấm',       value: stats.pendingGrading, icon: Icon.grading,   clr: stats.pendingGrading > 0 ? '#d97706' : 'var(--text-3)' },
    { label: 'Tổng lượt thi',  value: stats.totalAttempts,  icon: Icon.attempts,  clr: 'var(--text-2)' },
    { label: 'Điểm TB',        value: stats.avgScore != null ? stats.avgScore.toFixed(1) : '—', icon: Icon.pass, clr: '#d97706' },
    { label: 'Tỉ lệ đạt',      value: stats.passRate != null ? `${stats.passRate}%` : '—',      icon: Icon.pass, clr: '#16a34a' },
  ] : []

  return (
    <div className="max-w-5xl mx-auto space-y-6">

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

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {QuickLinks.map(q => (
          <Link key={q.to} to={q.to}
            className="card p-4 hover:border-[var(--border-strong)] transition-colors group">
            <div className="mb-3 transition-colors" style={{ color: 'var(--text-3)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
              {q.icon}
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{q.label}</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-3)' }}>{q.desc}</p>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {loading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="card p-4 space-y-2">
                <Skeleton w="w-5" h="h-5"/>
                <Skeleton w="w-10" h="h-6"/>
                <Skeleton w="w-16" h="h-3"/>
              </div>
            ))
          : statCards.map(s => (
              <div key={s.label} className="card p-4">
                <div className="mb-2" style={{ color: s.clr }}>{s.icon}</div>
                <div className="font-display font-semibold text-xl" style={{ color: 'var(--text-1)' }}>{s.value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{s.label}</div>
              </div>
            ))
        }
      </div>

      {/* Pending grading alert */}
      {!loading && stats?.pendingGrading > 0 && (
        <Link to="/teacher/grading"
          className="flex items-center justify-between px-5 py-3.5 rounded-lg border transition-colors"
          style={{ background: 'rgba(217,119,6,0.06)', borderColor: 'rgba(217,119,6,0.25)' }}>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"/>
            <p className="text-sm font-medium" style={{ color: '#d97706' }}>
              Có <strong>{stats.pendingGrading}</strong> bài tự luận đang chờ chấm điểm
            </p>
          </div>
          <span style={{ color: '#d97706' }}>{Icon.arrow}</span>
        </Link>
      )}

      {/* Course stats table */}
      <div className="card-bare">
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-base)' }}>
          <h2 className="section-title">Thống kê theo lớp</h2>
          <Link to="/teacher/courses" className="text-xs" style={{ color: 'var(--accent)' }}>Quản lý lớp →</Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--border-strong)', borderTopColor: 'var(--accent)' }}/>
          </div>
        ) : !stats?.courseStats?.length ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>Bạn chưa có lớp học nào</p>
            <Link to="/teacher/courses" className="btn-primary mt-4 inline-flex">Tạo lớp đầu tiên</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-base)' }}>
                  {['Lớp học', 'Sinh viên', 'Đề thi', 'Lượt thi'].map(h => (
                    <th key={h} className="th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.courseStats.map(c => (
                  <tr key={c.courseId} className="table-row cursor-pointer"
                    onClick={() => navigate(`/teacher/courses/${c.courseId}`)}>
                    <td className="td font-medium" style={{ color: 'var(--text-1)' }}>{c.courseName}</td>
                    <td className="td" style={{ color: 'var(--text-2)' }}>{c.studentCount} SV</td>
                    <td className="td" style={{ color: 'var(--text-2)' }}>{c.examCount} đề</td>
                    <td className="td" style={{ color: 'var(--text-2)' }}>{c.attemptCount} lượt</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
