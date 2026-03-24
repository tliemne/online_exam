import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'

// ── Tooltip ────────────────────────────────────────────────
function Tooltip({ text, x, y, visible }) {
  if (!visible || !text) return null
  return (
    <g>
      <rect x={x - 36} y={y - 28} width={72} height={20} rx="4"
        fill="var(--bg-elevated)" stroke="var(--border-base)" strokeWidth="1"/>
      <text x={x} y={y - 14} textAnchor="middle" fontSize="10" fontWeight="600"
        fill="var(--text-1)">{text}</text>
    </g>
  )
}

// ── Wave Line Chart ────────────────────────────────────────
function WaveChart({ data, color = 'var(--accent)', height = 100 }) {
  const [hovered, setHovered] = useState(null)
  if (!data?.length) return null

  const w = 300, h = height, padX = 16, padY = 20
  const max = Math.max(...data.map(d => d.value), 1)
  const pts = data.map((d, i) => {
    const x = padX + (i / Math.max(data.length - 1, 1)) * (w - padX * 2)
    const y = padY + (1 - d.value / max) * (h - padY * 1.5)
    return [x, y]
  })

  const pathD = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt[0]},${pt[1]}`
    const prev = pts[i - 1]
    const cpx = (prev[0] + pt[0]) / 2
    return acc + ` C ${cpx},${prev[1]} ${cpx},${pt[1]} ${pt[0]},${pt[1]}`
  }, '')
  const areaD = pathD + ` L ${pts[pts.length-1][0]},${h} L ${pts[0][0]},${h} Z`

  // Y-axis grid lines
  const gridLines = [0, 0.5, 1].map(pct => ({
    y: padY + (1 - pct) * (h - padY * 1.5),
    label: Math.round(max * pct)
  }))

  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full" style={{ height: height + 20 }}>
      <defs>
        <linearGradient id={`wg-${color.replace(/[^a-z]/gi,'')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* Grid */}
      {gridLines.map((g, i) => (
        <g key={i}>
          <line x1={padX} y1={g.y} x2={w - padX} y2={g.y}
            stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3,3"/>
          <text x={padX - 4} y={g.y + 3} textAnchor="end" fontSize="9" fill="var(--text-3)">{g.label}</text>
        </g>
      ))}
      <path d={areaD} fill={`url(#wg-${color.replace(/[^a-z]/gi,'')})`}/>
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      {/* X labels */}
      {data.map((d, i) => (
        <text key={i} x={pts[i][0]} y={h + 14} textAnchor="middle"
          fontSize="10" fill={hovered === i ? 'var(--text-1)' : 'var(--text-3)'}>
          {d.label.length > 7 ? d.label.slice(0, 7) + '…' : d.label}
        </text>
      ))}
      {/* Points + hover zones */}
      {pts.map((pt, i) => (
        <g key={i}>
          <circle cx={pt[0]} cy={pt[1]} r={hovered === i ? 5 : 3.5}
            fill={color} stroke="var(--bg-surface)" strokeWidth="1.5"
            style={{ transition: 'r 0.15s' }}/>
          <rect x={pt[0] - 20} y={0} width={40} height={h + 20}
            fill="transparent"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}/>
          {hovered === i && (
            <Tooltip text={`${data[i].label}: ${data[i].value}`}
              x={pt[0]} y={pt[1]} visible/>
          )}
        </g>
      ))}
    </svg>
  )
}

// ── Bar Chart ──────────────────────────────────────────────
function BarChart({ data, height = 110 }) {
  const [hovered, setHovered] = useState(null)
  if (!data?.length) return null

  const w = 300, padX = 30, padY = 24
  const max = Math.max(...data.map(d => d.value), 1)
  const barW = Math.min(36, Math.floor((w - padX * 2) / data.length) - 10)

  const gridVals = [0, Math.round(max / 2), max]

  return (
    <svg viewBox={`0 0 ${w} ${height + padY + 20}`} className="w-full">
      {/* Grid */}
      {gridVals.map((v, i) => {
        const gy = padY + (1 - v / max) * height
        return (
          <g key={i}>
            <line x1={padX} y1={gy} x2={w - 10} y2={gy}
              stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3,3"/>
            <text x={padX - 4} y={gy + 3} textAnchor="end" fontSize="9" fill="var(--text-3)">{v}</text>
          </g>
        )
      })}
      {/* Bars */}
      {data.map((d, i) => {
        const x = padX + i * ((w - padX * 2) / data.length) + ((w - padX * 2) / data.length - barW) / 2
        const barH = Math.max((d.value / max) * height, 2)
        const y = padY + height - barH
        const clr = hovered === i ? 'var(--accent)'
          : d.value / max >= 0.7 ? 'var(--success)'
          : d.value / max >= 0.4 ? 'var(--accent)'
          : 'var(--warning)'
        return (
          <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'default' }}>
            <rect x={x} y={y} width={barW} height={barH} rx="3" fill={clr} opacity={hovered === i ? 1 : 0.8}/>
            <text x={x + barW / 2} y={padY + height + 14} textAnchor="middle"
              fontSize="10" fill={hovered === i ? 'var(--text-1)' : 'var(--text-3)'}>
              {d.label.length > 7 ? d.label.slice(0, 7) + '…' : d.label}
            </text>
            {hovered === i && (
              <Tooltip text={`${d.value} SV`} x={x + barW / 2} y={y} visible/>
            )}
          </g>
        )
      })}
      <line x1={padX} y1={padY + height} x2={w - 10} y2={padY + height}
        stroke="var(--border-base)" strokeWidth="1"/>
    </svg>
  )
}

// ── Donut ─────────────────────────────────────────────────
function Donut({ pct, color, size = 80, label }) {
  const r = 30, c = size / 2, circ = 2 * Math.PI * r
  const dash = circ * Math.min((pct ?? 0) / 100, 1)
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={c} cy={c} r={r} fill="none" strokeWidth="7" stroke="var(--border-base)"/>
        <circle cx={c} cy={c} r={r} fill="none" strokeWidth="7"
          stroke={color} strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round" transform={`rotate(-90 ${c} ${c})`}/>
        <text x={c} y={c + 5} textAnchor="middle" fontSize="15" fontWeight="700"
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
    label: c.courseName || '',
    value: c.attemptCount ?? 0,
  }))

  const barData = stats?.courseStats?.map(c => ({
    label: c.courseName || '',
    value: c.studentCount ?? 0,
  }))

  const passRate = stats?.passRate ?? 0

  return (
    <div className="max-w-5xl mx-auto space-y-5">
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

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Lớp của tôi',   value: stats?.myCourses },
          { label: 'Đề thi',        value: stats?.myExams, sub: `${stats?.publishedExams ?? 0} đang mở` },
          { label: 'Tổng lượt thi', value: stats?.totalAttempts, sub: stats?.avgScore != null ? `TB ${stats.avgScore.toFixed(1)} điểm` : null },
          { label: 'Câu hỏi chờ',  value: stats?.pendingGrading, sub: 'cần chấm', warn: (stats?.pendingGrading ?? 0) > 0 },
        ].map(m => (
          <div key={m.label} className="card p-4">
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{m.label}</p>
            <p className="text-2xl font-semibold mt-1"
              style={{ color: m.warn && m.value > 0 ? 'var(--warning)' : 'var(--text-1)' }}>
              {loading ? <Skeleton w="w-10" h="h-7"/> : (m.value ?? 0)}
            </p>
            {!loading && m.sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{m.sub}</p>}
          </div>
        ))}
      </div>

      {/* Charts */}
      {!loading && stats?.courseStats?.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4">
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-2)' }}>Lượt thi theo lớp</p>
            <WaveChart data={waveData} color="var(--accent)" height={100}/>
          </div>
          <div className="card p-4">
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-2)' }}>Sinh viên theo lớp</p>
            <BarChart data={barData} height={100}/>
          </div>
          <div className="card p-4 flex flex-col items-center justify-center gap-2">
            <p className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Tỉ lệ đạt</p>
            <Donut pct={Math.round(passRate)}
              color={passRate >= 70 ? 'var(--success)' : passRate >= 50 ? 'var(--warning)' : 'var(--danger)'}
              label="bài đã chấm"/>
          </div>
        </div>
      )}

      {/* Nav + Table */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          {NAV.map((n, i) => (
            <Link key={n.to} to={n.to}
              className="card p-3.5 flex items-center justify-between hover:border-[var(--border-strong)] transition-all">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-3)' }}>{i + 1}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{n.label}</span>
              </div>
              <span style={{ color: 'var(--text-3)' }}>→</span>
            </Link>
          ))}
        </div>

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
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ width: 40, background: 'var(--border-base)' }}>
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
