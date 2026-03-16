import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'

// ── Wave Line Chart (số lượt thi theo lớp) ────────────────
function WaveChart({ data, color = 'var(--accent)', height = 80 }) {
  if (!data?.length) return null
  const w = 300, h = height, pad = 12
  const max = Math.max(...data.map(d => d.value), 1)
  const pts = data.map((d, i) => {
    const x = pad + (i / (data.length - 1 || 1)) * (w - pad * 2)
    const y = h - pad - (d.value / max) * (h - pad * 2)
    return [x, y]
  })

  // Smooth bezier curve
  const pathD = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt[0]},${pt[1]}`
    const prev = pts[i - 1]
    const cpx = (prev[0] + pt[0]) / 2
    return acc + ` C ${cpx},${prev[1]} ${cpx},${pt[1]} ${pt[0]},${pt[1]}`
  }, '')

  const areaD = pathD + ` L ${pts[pts.length-1][0]},${h} L ${pts[0][0]},${h} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#waveGrad)"/>
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      {pts.map((pt, i) => (
        <circle key={i} cx={pt[0]} cy={pt[1]} r="3" fill={color}/>
      ))}
      {data.map((d, i) => (
        <text key={i} x={pts[i][0]} y={h - 1} textAnchor="middle"
          fontSize="8" fill="var(--text-3)">{d.label}</text>
      ))}
    </svg>
  )
}

// ── Bar Chart (so sánh các lớp) ───────────────────────────
function BarChart({ data, height = 100 }) {
  if (!data?.length) return null
  const max = Math.max(...data.map(d => d.value), 1)
  const barW = Math.min(40, Math.floor(260 / data.length) - 8)

  return (
    <svg viewBox={`0 0 300 ${height + 24}`} className="w-full">
      {data.map((d, i) => {
        const x = 20 + i * (260 / data.length) + (260 / data.length - barW) / 2
        const barH = Math.max((d.value / max) * height, 2)
        const y = height - barH
        const clr = d.value / max >= 0.7 ? 'var(--success)'
                  : d.value / max >= 0.4 ? 'var(--accent)'
                  : 'var(--warning)'
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx="3"
              fill={clr} opacity="0.85"/>
            <text x={x + barW / 2} y={height + 12} textAnchor="middle"
              fontSize="7.5" fill="var(--text-3)">
              {d.label.length > 6 ? d.label.slice(0, 6) + '…' : d.label}
            </text>
            <text x={x + barW / 2} y={y - 3} textAnchor="middle"
              fontSize="8" fontWeight="600" fill={clr}>{d.value}</text>
          </g>
        )
      })}
      {/* baseline */}
      <line x1="16" y1={height} x2="284" y2={height}
        stroke="var(--border-base)" strokeWidth="1"/>
    </svg>
  )
}

// ── Donut ─────────────────────────────────────────────────
function Donut({ pct, color, size = 72, label }) {
  const r = 28, c = size / 2, circ = 2 * Math.PI * r
  const dash = circ * Math.min((pct ?? 0) / 100, 1)
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={c} cy={c} r={r} fill="none" strokeWidth="6" stroke="var(--border-base)"/>
        <circle cx={c} cy={c} r={r} fill="none" strokeWidth="6"
          stroke={color} strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round" transform={`rotate(-90 ${c} ${c})`}/>
        <text x={c} y={c + 4} textAnchor="middle" fontSize="13" fontWeight="700"
          fill="var(--text-1)">{pct ?? '—'}{pct != null ? '%' : ''}</text>
      </svg>
      <span className="text-xs text-center" style={{ color: 'var(--text-3)' }}>{label}</span>
    </div>
  )
}

function Skeleton({ w = 'w-12', h = 'h-7' }) {
  return <span className={`inline-block rounded animate-pulse ${w} ${h}`}
    style={{ background: 'var(--bg-elevated)' }}/>
}

const NAV = [
  { to: '/teacher/courses',   label: 'Lớp học'       },
  { to: '/teacher/questions', label: 'Ngân hàng câu' },
  { to: '/teacher/exams',     label: 'Bài kiểm tra'  },
  { to: '/teacher/grading',   label: 'Chấm điểm'     },
]

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

  const waveData = stats?.courseStats?.map(c => ({
    label: c.courseName?.slice(0, 8) || '',
    value: c.attemptCount ?? 0,
  }))

  const barData = stats?.courseStats?.map(c => ({
    label: c.courseName || '',
    value: c.studentCount ?? 0,
  }))

  const passRate = stats?.passRate ?? 0

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="page-title">Tổng quan</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            Xin chào, <span className="font-medium" style={{ color: 'var(--text-1)' }}>{user?.fullName || user?.username}</span>
          </p>
        </div>
        {!loading && stats?.pendingGrading > 0 && (
          <button onClick={() => navigate('/teacher/grading')}
            className="text-sm px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: 'var(--warning-subtle)', color: 'var(--warning)', border: '1px solid var(--warning-border)' }}>
            {stats.pendingGrading} bài chờ chấm →
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--danger-subtle)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {/* Metric row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Lớp của tôi',   value: stats?.myCourses,      sub: null },
          { label: 'Đề thi',        value: stats?.myExams,        sub: `${stats?.publishedExams ?? 0} đang mở` },
          { label: 'Tổng lượt thi', value: stats?.totalAttempts,  sub: stats?.avgScore != null ? `TB ${stats.avgScore.toFixed(1)} điểm` : null },
          { label: 'Câu hỏi chờ',  value: stats?.pendingGrading, sub: 'cần chấm', warn: (stats?.pendingGrading ?? 0) > 0 },
        ].map(m => (
          <div key={m.label} className="card p-4">
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{m.label}</p>
            <p className="text-2xl font-semibold mt-1"
              style={{ color: m.warn && m.value > 0 ? 'var(--warning)' : 'var(--text-1)' }}>
              {loading ? <Skeleton w="w-10" h="h-7"/> : (m.value ?? 0)}
            </p>
            {!loading && m.sub && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{m.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Charts row */}
      {!loading && stats?.courseStats?.length > 0 && (
        <div className="grid grid-cols-3 gap-3">

          {/* Wave: lượt thi theo lớp */}
          <div className="card p-4 col-span-1">
            <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-2)' }}>Lượt thi theo lớp</p>
            <WaveChart data={waveData} color="var(--accent)" height={80}/>
          </div>

          {/* Bar: số sinh viên theo lớp */}
          <div className="card p-4 col-span-1">
            <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-2)' }}>Sinh viên theo lớp</p>
            <BarChart data={barData} height={80}/>
          </div>

          {/* Donut: tỉ lệ đạt */}
          <div className="card p-4 col-span-1 flex flex-col items-center justify-center gap-3">
            <p className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Tỉ lệ đạt toàn phần</p>
            <Donut
              pct={Math.round(passRate)}
              color={passRate >= 70 ? 'var(--success)' : passRate >= 50 ? 'var(--warning)' : 'var(--danger)'}
              label="bài đã chấm"
            />
          </div>
        </div>
      )}

      {/* Nav + Course table */}
      <div className="grid grid-cols-3 gap-3">
        {/* Quick nav */}
        <div className="space-y-2">
          {NAV.map((n, i) => (
            <Link key={n.to} to={n.to}
              className="card p-3.5 flex items-center justify-between hover:border-[var(--border-strong)] transition-all group">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-3)' }}>{i + 1}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{n.label}</span>
              </div>
              <span style={{ color: 'var(--text-3)' }}>→</span>
            </Link>
          ))}
        </div>

        {/* Course stats table */}
        {stats?.courseStats?.length > 0 && (
          <div className="card-bare col-span-2 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'var(--border-base)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Chi tiết theo lớp</span>
              <Link to="/teacher/courses" className="text-xs" style={{ color: 'var(--accent)' }}>Xem tất cả →</Link>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-base)' }}>
                  {['Lớp', 'SV', 'Đề', 'Lượt', 'Đạt'].map(h => (
                    <th key={h} className="th py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.courseStats.map(c => (
                  <tr key={c.courseId} className="table-row cursor-pointer"
                    onClick={() => navigate(`/teacher/courses/${c.courseId}`)}>
                    <td className="td font-medium py-3" style={{ color: 'var(--text-1)' }}>{c.courseName}</td>
                    <td className="td py-3">{c.studentCount}</td>
                    <td className="td py-3">{c.examCount}</td>
                    <td className="td py-3">{c.attemptCount}</td>
                    <td className="td py-3">
                      {c.passRate != null ? (
                        <div className="flex items-center gap-1.5">
                          <div className="h-1 rounded-full" style={{ width: 36, background: 'var(--border-base)' }}>
                            <div className="h-full rounded-full"
                              style={{ width: `${c.passRate}%`, background: c.passRate >= 70 ? 'var(--success)' : c.passRate >= 50 ? 'var(--warning)' : 'var(--danger)' }}/>
                          </div>
                          <span className="text-xs font-mono">{c.passRate}%</span>
                        </div>
                      ) : <span style={{ color: 'var(--text-3)' }}>—</span>}
                    </td>
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
