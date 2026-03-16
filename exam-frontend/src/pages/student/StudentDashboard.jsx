import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { attemptApi } from '../../api/services'
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

// ── Weakness Widget ────────────────────────────────────────
function WeaknessWidget() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen]       = useState(false)

  const load = async () => {
    if (data) { setOpen(true); return }
    setLoading(true)
    try {
      const r = await attemptApi.aiWeakness()
      setData(r.data.data)
      setOpen(true)
    } catch {} finally { setLoading(false) }
  }

  // Tính điểm tổng quát từ data (không cần AI)
  const getOverall = (topics) => {
    if (!topics?.length) return null
    const avg = topics.reduce((s, t) => s + t.correctPct, 0) / topics.length
    if (avg >= 80) return { label: 'Xuất sắc',      color: 'var(--success)' }
    if (avg >= 65) return { label: 'Khá',            color: 'var(--accent)'  }
    if (avg >= 50) return { label: 'Trung bình',     color: 'var(--warning)' }
    return           { label: 'Cần cải thiện',   color: 'var(--danger)'  }
  }

  // Gợi ý cụ thể dựa trên data
  const getSuggestions = (topics) => {
    if (!topics?.length) return []
    const weak = topics.filter(t => t.correctPct < 60)
    const ok   = topics.filter(t => t.correctPct >= 80)
    const tips = []
    weak.forEach(t => {
      const pct = t.correctPct
      if (pct < 30)      tips.push({ topic: t.topic, msg: `Rất yếu — nên học lại từ đầu`, level: 'danger' })
      else if (pct < 50) tips.push({ topic: t.topic, msg: `Yếu — cần luyện thêm nhiều bài tập`, level: 'danger' })
      else               tips.push({ topic: t.topic, msg: `Trung bình — ôn lại các điểm dễ nhầm`, level: 'warning' })
    })
    if (ok.length > 0 && weak.length > 0) {
      tips.push({ topic: ok[0].topic, msg: `Điểm mạnh — tiếp tục duy trì`, level: 'success' })
    }
    return tips
  }

  return (
    <>
      <button onClick={load} disabled={loading}
        className="card p-4 w-full text-left hover:border-[var(--border-strong)] transition-all flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>✦ Phân tích học lực</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>AI phân tích từ lịch sử thi của bạn</p>
        </div>
        {loading
          ? <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--purple)' }}/>
          : <span style={{ color: 'var(--purple)' }}>→</span>}
      </button>

      {open && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-base)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0"
              style={{ borderColor: 'var(--border-base)', background: 'var(--bg-surface)' }}>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-1)' }}>✦ Phân tích học lực</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Powered by Gemini AI · Cache 2 giờ</p>
              </div>
              <button onClick={() => setOpen(false)} className="btn-ghost p-1.5">✕</button>
            </div>

            <div className="p-5 space-y-5">
              {data.topics?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Chưa đủ dữ liệu</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Cần ít nhất 3 câu/chủ đề để phân tích</p>
                </div>
              ) : (<>
                {/* Overall score */}
                {(() => {
                  const overall = getOverall(data.topics)
                  const avgPct = Math.round(data.topics.reduce((s, t) => s + t.correctPct, 0) / data.topics.length)
                  return overall && (
                    <div className="flex items-center gap-4 p-4 rounded-lg"
                      style={{ background: 'var(--bg-elevated)' }}>
                <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm" style={{ color: overall.color }}>{overall.label}</p>
                          <span className="text-lg font-bold" style={{ color: overall.color }}>{avgPct}%</span>
                        </div>
                        <div className="h-2 rounded-full mt-1.5 overflow-hidden" style={{ background: 'var(--border-base)' }}>
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${avgPct}%`, background: overall.color }}/>
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                          Trung bình {data.topics.length} chủ đề · {data.topics.reduce((s,t)=>s+t.total,0)} câu hỏi
                        </p>
                      </div>
                    </div>
                  )
                })()}

                {/* AI advice nếu có */}
                {data.advice && (
                  <div className="px-4 py-3 rounded-lg"
                    style={{ background: 'var(--accent-subtle)' }}>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{data.advice}</p>
                  </div>
                )}

                {/* Topic breakdown */}
                <div>
                  <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-3)' }}>
                    CHI TIẾT TỪNG CHỦ ĐỀ
                  </p>
                  <div className="space-y-3">
                    {data.topics.map(t => {
                      const clr = t.correctPct >= 70 ? 'var(--success)' : t.correctPct >= 50 ? 'var(--warning)' : 'var(--danger)'
                      const label = t.correctPct >= 70 ? 'Tốt' : t.correctPct >= 50 ? 'TB' : 'Yếu'
                      return (
                        <div key={t.topic} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium" style={{ color: 'var(--text-1)' }}>{t.topic}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                                style={{ background: clr + '20', color: clr }}>{label}</span>
                            </div>
                            <span className="text-xs font-mono" style={{ color: clr }}>
                              {t.correct}/{t.total} ({t.correctPct}%)
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-base)' }}>
                            <div className="h-full rounded-full" style={{ width: `${t.correctPct}%`, background: clr }}/>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Specific suggestions */}
                {(() => {
                  const tips = getSuggestions(data.topics)
                  return tips.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-3)' }}>
                        GỢI Ý CỤ THỂ
                      </p>
                      <div className="space-y-2">
                        {tips.map((tip, i) => {
                          const clr = tip.level === 'danger' ? 'var(--danger)' : tip.level === 'warning' ? 'var(--warning)' : 'var(--success)'
                          
                          return (
                            <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg"
                              style={{ background: 'var(--bg-elevated)' }}>
                              <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: clr }}/>
                              <div>
                                <span className="text-xs font-semibold" style={{ color: clr }}>{tip.topic}</span>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{tip.msg}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {/* AI Roadmap */}
                {data.roadmap?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-3)' }}>
                      LỘ TRÌNH HỌC TẬP
                    </p>
                    <div className="space-y-3">
                      {data.roadmap.map((item, i) => {
                        const priClr = item.priority === 'HIGH' ? 'var(--danger)' : item.priority === 'MEDIUM' ? 'var(--warning)' : 'var(--accent)'
                        const priLabel = item.priority === 'HIGH' ? 'Ưu tiên cao' : item.priority === 'MEDIUM' ? 'Trung bình' : 'Thấp'
                        return (
                          <div key={i} className="rounded-lg border p-3.5 space-y-2"
                            style={{ borderColor: 'var(--border-base)' }}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{item.topic}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full"
                                style={{ background: priClr + '18', color: priClr }}>{priLabel}</span>
                            </div>
                            <p className="text-xs" style={{ color: 'var(--text-2)' }}>{item.action}</p>
                            {item.keywords?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.keywords.map((kw, j) => (
                                  <span key={j} className="text-[10px] px-1.5 py-0.5 rounded"
                                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-3)' }}>{kw}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>)}
            </div>
          </div>
        </div>
      )}
    </>
  )
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
        <div className="col-span-2">
          <WeaknessWidget/>
        </div>
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
