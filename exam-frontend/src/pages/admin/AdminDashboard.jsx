import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'
import ReactApexChart from 'react-apexcharts'

const Icon = {
  users:    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>,
  student:  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"/></svg>,
  teacher:  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>,
  course:   <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>,
  exam:     <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>,
  attempts: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>,
  pass:     <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  score:    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>,
}

function Skeleton({ w = 'w-12', h = 'h-7' }) {
  return <span className={`inline-block rounded animate-pulse ${w} ${h}`}
    style={{ background: 'var(--bg-elevated)' }}/>
}

export default function AdminDashboard() {
  const { user }              = useAuth()
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    api.get('/dashboard/admin')
      .then(r => setStats(r.data.data))
      .catch(e => setError(e?.response?.data?.message || 'Không tải được dữ liệu'))
      .finally(() => setLoading(false))
  }, [])

  const statCards = stats ? [
    { label: 'Tổng tài khoản', value: stats.totalUsers,    icon: Icon.users,    to: '/admin/users',   clr: 'var(--accent)'  },
    { label: 'Sinh viên',      value: stats.totalStudents, icon: Icon.student,  to: '/admin/users',   clr: '#16a34a'        },
    { label: 'Giảng viên',     value: stats.totalTeachers, icon: Icon.teacher,  to: '/admin/users',   clr: '#0891b2'        },
    { label: 'Lớp học',        value: stats.totalCourses,  icon: Icon.course,   to: '/admin/courses', clr: '#d97706'        },
    { label: 'Đề thi',         value: stats.totalExams,    icon: Icon.exam,     to: null,             clr: '#9333ea'        },
    { label: 'Lượt làm bài',   value: stats.totalAttempts, icon: Icon.attempts, to: null,             clr: 'var(--text-2)'  },
    { label: 'Điểm TB',        value: stats.avgScore != null ? stats.avgScore.toFixed(1) : '—', icon: Icon.score, to: null, clr: '#d97706' },
    { label: 'Tỉ lệ đạt',      value: stats.passRate != null ? `${stats.passRate}%` : '—',     icon: Icon.pass,  to: null, clr: '#16a34a' },
  ] : []

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="page-title">Tổng quan hệ thống</h1>
        <p className="page-subtitle">
          Xin chào, <span style={{ color: 'var(--text-2)' }}>{user?.fullName || user?.username}</span>
        </p>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm border"
          style={{ background: 'rgba(220,38,38,0.06)', borderColor: 'rgba(220,38,38,0.2)', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card p-4 space-y-2.5">
                <Skeleton w="w-5" h="h-5"/>
                <Skeleton w="w-14" h="h-7"/>
                <Skeleton w="w-20" h="h-3"/>
              </div>
            ))
          : statCards.map(s => {
              const content = (
                <div className="card p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: s.clr + '18' }}>
                      <span style={{ color: s.clr }}>{s.icon}</span>
                    </div>
                  </div>
                  <div className="font-bold text-2xl" style={{ color: 'var(--text-1)' }}>{s.value}</div>
                  <div className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>{s.label}</div>
                </div>
              )
              return s.to
                ? <Link key={s.label} to={s.to}>{content}</Link>
                : <div key={s.label}>{content}</div>
            })
        }
      </div>

      {/* Highlight row */}
      {!loading && stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
              {Icon.exam}
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Đề đang mở (Published)</p>
              <p className="font-display font-semibold text-xl" style={{ color: 'var(--text-1)' }}>
                {stats.publishedExams}
                <span className="text-sm font-normal ml-1.5" style={{ color: 'var(--text-3)' }}>/ {stats.totalExams} đề</span>
              </p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(22,163,74,0.1)', color: '#16a34a' }}>
              {Icon.pass}
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Tỉ lệ đạt toàn hệ thống</p>
              <p className="font-display font-semibold text-xl" style={{ color: 'var(--text-1)' }}>
                {stats.passRate}%
                <span className="text-sm font-normal ml-1.5" style={{ color: 'var(--text-3)' }}>trên {stats.totalAttempts} lượt</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Monthly Attempts Bar Chart */}
          <div className="card lg:col-span-2">
            <p className="font-bold mb-0.5" style={{ color: 'var(--text-1)' }}>Lượt thi theo tháng</p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>6 tháng gần nhất</p>
            {stats.monthlyAttempts && stats.monthlyAttempts.length > 0 ? (
              <ReactApexChart type="bar" height={200}
                series={[{
                  name: 'Lượt thi',
                  data: stats.monthlyAttempts.map(m => m.count)
                }]}
                options={{
                  chart: { 
                    background: 'transparent',
                    toolbar: { show: false }
                  },
                  theme: { mode: document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark' },
                  xaxis: {
                    categories: stats.monthlyAttempts.map(m => m.month),
                    labels: { 
                      style: { colors: 'var(--text-3)', fontSize: '11px' },
                      rotate: -45,
                      rotateAlways: true
                    }
                  },
                  yaxis: {
                    labels: { style: { colors: 'var(--text-3)' } }
                  },
                  colors: ['var(--accent)'],
                  plotOptions: {
                    bar: {
                      borderRadius: 6,
                      columnWidth: '60%'
                    }
                  },
                  dataLabels: { enabled: false },
                  grid: {
                    borderColor: 'var(--border-base)',
                    strokeDashArray: 3
                  },
                  tooltip: {
                    theme: 'dark',
                    y: { formatter: (val) => `${val} lượt` }
                  }
                }}
              />
            ) : (
              <p className="text-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>Chưa có dữ liệu</p>
            )}
          </div>

          {/* User Distribution Donut */}
          <div className="card flex flex-col items-center justify-center">
            <p className="font-bold mb-0.5 self-start" style={{ color: 'var(--text-1)' }}>Người dùng</p>
            <p className="text-xs mb-3 self-start" style={{ color: 'var(--text-3)' }}>Phân bổ vai trò</p>
            <ReactApexChart type="donut" height={160} width={160}
              series={[stats.totalStudents ?? 0, stats.totalTeachers ?? 0]}
              options={{
                chart: { background: 'transparent' },
                theme: { mode: document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark' },
                labels: ['Sinh viên', 'Giảng viên'],
                colors: ['#7551FF', '#01B574'],
                legend: { show: false },
                dataLabels: { enabled: false },
                stroke: { width: 0 },
                plotOptions: { pie: { donut: { size: '68%' } } },
                tooltip: { theme: 'dark' },
              }}
            />
            <div className="flex gap-5 mt-3">
              {[['#7551FF','SV',stats.totalStudents??0],['#01B574','GV',stats.totalTeachers??0]].map(([c,l,v])=>(
                <div key={l} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{background:c}}/>
                  <span className="text-xs" style={{color:'var(--text-3)'}}>{l}: {v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Score Distribution Chart */}
      {stats && stats.scoreDistribution && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <p className="font-bold mb-0.5" style={{ color: 'var(--text-1)' }}>Phân bố điểm</p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>Theo thang điểm 10</p>
            <ReactApexChart type="pie" height={280}
              series={[
                stats.scoreDistribution.excellent,
                stats.scoreDistribution.good,
                stats.scoreDistribution.fair,
                stats.scoreDistribution.average,
                stats.scoreDistribution.poor
              ]}
              options={{
                chart: { background: 'transparent' },
                theme: { mode: document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark' },
                labels: ['Xuất sắc (9-10)', 'Giỏi (8-9)', 'Khá (7-8)', 'Trung bình (5-7)', 'Yếu (<5)'],
                colors: ['#16a34a', '#0891b2', '#d97706', '#f59e0b', '#dc2626'],
                legend: {
                  position: 'bottom',
                  labels: { colors: 'var(--text-2)' }
                },
                dataLabels: {
                  enabled: true,
                  formatter: (val) => `${val.toFixed(1)}%`
                },
                stroke: { width: 0 },
                tooltip: {
                  theme: 'dark',
                  y: { formatter: (val) => `${val} bài` }
                }
              }}
            />
          </div>

          <div className="card">
            <p className="font-bold mb-0.5" style={{ color: 'var(--text-1)' }}>Thống kê hệ thống</p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>Tổng quan toàn bộ</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Điểm TB',     value: stats.avgScore?.toFixed(1) ?? '—', color: 'var(--accent)',  bg: 'var(--accent-subtle)'  },
                { label: 'Tỉ lệ đạt',  value: `${stats.passRate ?? 0}%`,          color: 'var(--success)', bg: 'var(--success-subtle)' },
                { label: 'Đề thi',      value: stats.totalExams ?? 0,              color: 'var(--purple)',  bg: 'var(--purple-subtle)'  },
                { label: 'Lượt thi',    value: stats.totalAttempts ?? 0,           color: 'var(--text-2)',  bg: 'var(--bg-elevated)'    },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: s.bg }}>
                  <p className="font-bold text-2xl" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent attempts table */}
      <div className="card-bare">
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-base)' }}>
          <h2 className="section-title">Bài làm gần đây</h2>
          <Link to="/teacher/grading" className="text-xs transition-colors"
            style={{ color: 'var(--accent)' }}>Chấm điểm →</Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--border-strong)', borderTopColor: 'var(--accent)' }}/>
          </div>
        ) : !stats?.recentAttempts?.length ? (
          <p className="text-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>Chưa có bài làm nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-base)' }}>
                  {['Sinh viên', 'Đề thi', 'Lớp', 'Điểm', 'Kết quả', 'Nộp lúc'].map(h => (
                    <th key={h} className="th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentAttempts.map(a => (
                  <tr key={a.attemptId} className="table-row">
                    <td className="td font-medium" style={{ color: 'var(--text-1)' }}>{a.studentName}</td>
                    <td className="td" style={{ color: 'var(--text-2)' }}>{a.examTitle}</td>
                    <td className="td" style={{ color: 'var(--text-3)' }}>{a.courseName}</td>
                    <td className="td font-mono font-medium" style={{ color: 'var(--text-1)' }}>
                      {a.score != null ? `${a.score} / ${a.totalScore}` : '—'}
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
        )}
      </div>
    </div>
  )
}
