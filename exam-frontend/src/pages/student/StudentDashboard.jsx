import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'

// ── Wave score chart ───────────────────────────────────────
function ScoreWave({ attempts, height = 90 }) {
  if (!attempts?.length) return null
  const data = [...attempts].reverse().slice(0, 8) // oldest → newest
  const w = 280, h = height, pad = 14
  const maxScore = Math.max(...data.map(d => d.totalScore ?? 10), 10)
  const pts = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2)
    const y = d.score != null
      ? h - pad - (d.score / maxScore) * (h - pad * 2)
      : h - pad
    return [x, y, d]
  })

  const pathD = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt[0]},${pt[1]}`
    const prev = pts[i - 1]
    const cpx = (prev[0] + pt[0]) / 2
    return acc + ` C ${cpx},${prev[1]} ${cpx},${pt[1]} ${pt[0]},${pt[1]}`
  }, '')
  const areaD = pathD + ` L ${pts[pts.length-1][0]},${h-pad} L ${pts[0][0]},${h-pad} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* Pass threshold line */}
      {(() => {
        const passY = h - pad - (5 / maxScore) * (h - pad * 2)
        return <line x1={pad} y1={passY} x2={w - pad} y2={passY}
          stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="3,3"/>
      })()}
      <path d={areaD} fill="url(#scoreGrad)"/>
      <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
      {pts.map((pt, i) => {
        const d = pt[2]
        const clr = d.score == null ? 'var(--text-3)'
          : d.passed ? 'var(--success)' : 'var(--danger)'
        return (
          <g key={i}>
            <circle cx={pt[0]} cy={pt[1]} r="4" fill={clr} stroke="var(--bg-surface)" strokeWidth="1.5"/>
            {d.score != null && (
              <text x={pt[0]} y={pt[1] - 7} textAnchor="middle" fontSize="8" fontWeight="600" fill={clr}>
                {d.score.toFixed(1)}
              </text>
            )}
          </g>
        )
      })}
      <text x={w - pad} y={h - pad - (5 / maxScore) * (h - pad * 2) - 3}
        textAnchor="end" fontSize="7" fill="var(--text-3)">ngưỡng đạt</text>
    </svg>
  )
}

// ── Stat pill ──────────────────────────────────────────────
function StatPill({ label, value, color }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-0">
      <span className="text-xl font-bold" style={{ color }}>{value ?? '—'}</span>
      <span className="text-[10px] text-center leading-tight" style={{ color: 'var(--text-3)' }}>{label}</span>
    </div>
  )
}

function Skeleton({ w = 'w-12', h = 'h-7' }) {
  return <span className={`inline-block rounded animate-pulse ${w} ${h}`}
    style={{ background: 'var(--bg-elevated)' }}/>
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

  const avgColor = stats?.avgScore >= 8 ? 'var(--success)'
    : stats?.avgScore >= 5 ? 'var(--warning)' : 'var(--danger)'

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h1 className="page-title">Tổng quan</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
          Xin chào, <span className="font-medium" style={{ color: 'var(--text-1)' }}>{user?.fullName || user?.username}</span>
        </p>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--danger-subtle)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {/* Stats + wave chart in one card */}
      <div className="card p-5">
        {loading ? (
          <div className="flex justify-center py-6"><Skeleton w="w-full" h="h-24"/></div>
        ) : (
          <>
            {/* Stat row */}
            <div className="flex items-center justify-around pb-4 mb-4 border-b" style={{ borderColor: 'var(--border-base)' }}>
              <StatPill label="Lớp đang học"  value={stats?.enrolledCourses}  color="var(--accent)"/>
              <div className="w-px h-8" style={{ background: 'var(--border-base)' }}/>
              <StatPill label="Đề có thể thi" value={stats?.availableExams}   color="var(--purple)"/>
              <div className="w-px h-8" style={{ background: 'var(--border-base)' }}/>
              <StatPill label="Đã làm bài"    value={stats?.completedAttempts} color="var(--text-2)"/>
              <div className="w-px h-8" style={{ background: 'var(--border-base)' }}/>
              <StatPill label="Bài đạt"       value={stats?.passedAttempts}   color="var(--success)"/>
              <div className="w-px h-8" style={{ background: 'var(--border-base)' }}/>
              <StatPill label="Điểm TB"
                value={stats?.avgScore != null ? stats.avgScore.toFixed(1) : '—'}
                color={stats?.avgScore != null ? avgColor : 'var(--text-3)'}/>
            </div>

            {/* Wave chart */}
            {stats?.recentAttempts?.length > 0 ? (
              <>
                <p className="text-xs mb-2" style={{ color: 'var(--text-3)' }}>Điểm các bài thi gần đây</p>
                <ScoreWave attempts={stats.recentAttempts}/>
              </>
            ) : (
              <p className="text-center text-sm py-4" style={{ color: 'var(--text-3)' }}>
                Chưa có bài thi nào
              </p>
            )}
          </>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/student/exams"
          className="card p-4 hover:border-[var(--border-strong)] transition-all">
          <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Bài kiểm tra</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Xem và làm bài thi</p>
        </Link>
        <Link to="/student/results"
          className="card p-4 hover:border-[var(--border-strong)] transition-all">
          <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Kết quả của tôi</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Xem điểm và lịch sử thi</p>
        </Link>
      </div>

      {/* Recent table */}
      {!loading && stats?.recentAttempts?.length > 0 && (
        <div className="card-bare">
          <div className="flex items-center justify-between px-5 py-3.5 border-b"
            style={{ borderColor: 'var(--border-base)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Bài làm gần đây</span>
            <Link to="/student/results" className="text-xs" style={{ color: 'var(--accent)' }}>Xem tất cả →</Link>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-base)' }}>
                {['Đề thi', 'Lớp', 'Điểm', 'Kết quả', 'Nộp lúc'].map(h => (
                  <th key={h} className="th py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recentAttempts.map(a => {
                const pct = a.score != null && a.totalScore ? (a.score / a.totalScore) * 100 : 0
                const barClr = pct >= 70 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)'
                return (
                  <tr key={a.attemptId} className="table-row">
                    <td className="td font-medium py-3" style={{ color: 'var(--text-1)' }}>{a.examTitle}</td>
                    <td className="td py-3" style={{ color: 'var(--text-3)' }}>{a.courseName}</td>
                    <td className="td py-3">
                      {a.score != null ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ width: 48, background: 'var(--border-base)' }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barClr }}/>
                          </div>
                          <span className="text-xs font-mono" style={{ color: barClr }}>
                            {a.score.toFixed(1)}/{a.totalScore}
                          </span>
                        </div>
                      ) : <span className="text-xs" style={{ color: 'var(--text-3)' }}>—</span>}
                    </td>
                    <td className="td py-3">
                      {a.status === 'GRADED'
                        ? <span className={a.passed ? 'badge-green' : 'badge-red'}>{a.passed ? 'Đạt' : 'Chưa đạt'}</span>
                        : <span className="badge-amber">Chờ chấm</span>}
                    </td>
                    <td className="td py-3 text-xs" style={{ color: 'var(--text-3)' }}>{a.submittedAt || '—'}</td>
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
