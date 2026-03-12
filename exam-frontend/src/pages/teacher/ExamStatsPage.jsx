import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/client'

// ── Mini chart components (thuần SVG, không cần recharts) ──────────────────

function PieChart({ passCount, failCount }) {
  const total = passCount + failCount
  if (total === 0) return <div className="text-center text-[var(--text-3)] py-8">Chưa có dữ liệu</div>
  const passAngle = (passCount / total) * 360
  const r = 70, cx = 90, cy = 90
  const toRad = d => (d - 90) * Math.PI / 180
  const x1 = cx + r * Math.cos(toRad(0))
  const y1 = cy + r * Math.sin(toRad(0))
  const x2 = cx + r * Math.cos(toRad(passAngle))
  const y2 = cy + r * Math.sin(toRad(passAngle))
  const large = passAngle > 180 ? 1 : 0
  const passPath = total === passCount
    ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
    : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
  const failPath = total === failCount
    ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
    : `M ${cx} ${cy} L ${x2} ${y2} A ${r} ${r} 0 ${1 - large} 1 ${x1} ${y1} Z`

  return (
    <div className="flex items-center gap-6">
      <svg width="180" height="180">
        {passCount > 0 && <path d={passPath} fill="#22c55e" />}
        {failCount > 0 && <path d={failPath} fill="#ef4444" />}
        <circle cx={cx} cy={cy} r={r * 0.5} fill="var(--bg-card)" />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--text-1)" fontSize="16" fontWeight="bold">{Math.round(passCount/total*100)}%</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--text-3)" fontSize="11">Tỉ lệ đạt</text>
      </svg>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block"/>
          <span className="text-sm text-[var(--text-2)]">Đạt: <b className="text-green-400">{passCount}</b></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block"/>
          <span className="text-sm text-[var(--text-2)]">Trượt: <b className="text-red-400">{failCount}</b></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"/>
          <span className="text-sm text-[var(--text-2)]">Tổng: <b className="text-blue-400">{total}</b></span>
        </div>
      </div>
    </div>
  )
}

function Histogram({ data }) {
  if (!data?.length) return null
  const maxCount = Math.max(...data.map(d => d.count), 1)
  const colors = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6']
  return (
    <div className="space-y-2">
      {data.map((bucket, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-3)] w-16 text-right shrink-0">{bucket.label}</span>
          <div className="flex-1 h-8 bg-[var(--bg-1)] rounded overflow-hidden">
            <div
              className="h-full rounded transition-all duration-500 flex items-center justify-end pr-2"
              style={{ width: `${(bucket.count / maxCount) * 100}%`, backgroundColor: colors[i % colors.length], minWidth: bucket.count > 0 ? '2rem' : 0 }}
            >
              {bucket.count > 0 && <span className="text-white text-xs font-bold">{bucket.count}</span>}
            </div>
          </div>
          <span className="text-xs text-[var(--text-3)] w-8">{bucket.count} SV</span>
        </div>
      ))}
    </div>
  )
}

function BarChart({ data }) {
  if (!data?.length) return null
  const maxRate = 100
  return (
    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
      {data.map((q, i) => (
        <div key={q.questionId} className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-3)] w-6 shrink-0">C{i+1}</span>
          <div className="flex-1 space-y-1">
            <div className="text-xs text-[var(--text-2)] truncate" title={q.questionContent}>
              {q.questionContent}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 bg-[var(--bg-1)] rounded overflow-hidden">
                <div
                  className="h-full rounded"
                  style={{
                    width: `${q.correctRate}%`,
                    backgroundColor: q.correctRate >= 70 ? '#22c55e' : q.correctRate >= 40 ? '#eab308' : '#ef4444'
                  }}
                />
              </div>
              <span className="text-xs font-medium w-10 text-right"
                style={{ color: q.correctRate >= 70 ? '#22c55e' : q.correctRate >= 40 ? '#eab308' : '#ef4444' }}>
                {q.correctRate}%
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function ExamStatsPage() {
  const { examId } = useParams()
  const navigate   = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview') // overview | leaderboard | questions

  useEffect(() => {
    api.get(`/exam-stats/${examId}`)
      .then(r => setStats(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [examId])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"/>
    </div>
  )
  if (!stats) return <div className="p-8 text-center text-[var(--text-3)]">Không tải được dữ liệu</div>

  const tabs = [
    { id: 'overview',    label: 'Tổng quan' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'questions',   label: 'Theo câu hỏi' },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-[var(--text-3)] hover:text-[var(--text-1)] mb-1 flex items-center gap-1">
            ← Quay lại
          </button>
          <h1 className="text-2xl font-bold text-[var(--text-1)]">Thống kê đề thi</h1>
          <p className="text-[var(--text-3)] mt-1">{stats.examTitle}</p>
        </div>
        {stats.totalAttempts === 0 && (
          <div className="px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
            Chưa có sinh viên nộp bài
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Số lượt thi', value: stats.totalAttempts, color: 'text-blue-400' },
          { label: 'Điểm TB', value: stats.avgScore?.toFixed(1) ?? '—', sub: `/ ${stats.totalScoreMax}`, color: 'text-purple-400' },
          { label: 'Tỉ lệ đạt', value: `${stats.passRate}%`, color: stats.passRate >= 50 ? 'text-green-400' : 'text-red-400' },
          { label: 'Cao nhất', value: stats.maxScore?.toFixed(1) ?? '—', sub: `Thấp: ${stats.minScore?.toFixed(1) ?? '—'}`, color: 'text-yellow-400' },
        ].map((c, i) => (
          <div key={i} className="card p-4 rounded-xl space-y-1">
            <p className="text-xs text-[var(--text-3)]">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            {c.sub && <p className="text-xs text-[var(--text-3)]">{c.sub}</p>}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--bg-1)] p-1 rounded-lg w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-5 rounded-xl">
            <h3 className="font-semibold text-[var(--text-1)] mb-4">Tỉ lệ Đạt / Trượt</h3>
            <PieChart passCount={stats.passCount} failCount={stats.failCount} />
          </div>
          <div className="card p-5 rounded-xl">
            <h3 className="font-semibold text-[var(--text-1)] mb-4">Phân phối điểm số</h3>
            <Histogram data={stats.scoreDistribution} />
          </div>
        </div>
      )}

      {tab === 'leaderboard' && (
        <div className="card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-1)]">Top {stats.leaderboard?.length} sinh viên điểm cao nhất</h3>
          </div>
          {stats.leaderboard?.length === 0
            ? <div className="p-8 text-center text-[var(--text-3)]">Chưa có dữ liệu</div>
            : (
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-1)]">
                <tr>
                  {['#', 'Sinh viên', 'Mã SV', 'Điểm', 'Kết quả', 'Vi phạm', 'Nộp lúc'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-[var(--text-3)] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.leaderboard.map((entry, i) => (
                  <tr key={entry.studentId} className={`border-t border-[var(--border)] ${i < 3 ? 'bg-yellow-500/5' : ''}`}>
                    <td className="px-4 py-3 font-bold text-[var(--text-3)]">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : entry.rank}
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--text-1)]">{entry.studentName}</td>
                    <td className="px-4 py-3 text-[var(--text-3)]">{entry.studentCode || '—'}</td>
                    <td className="px-4 py-3 font-bold text-blue-400">{entry.score?.toFixed(1)} / {entry.totalScore}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        entry.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>{entry.passed ? 'Đạt' : 'Trượt'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.tabViolations > 0
                        ? <span className={`text-xs font-medium ${entry.tabViolations >= 3 ? 'text-red-400' : 'text-yellow-400'}`}>⚠ {entry.tabViolations}</span>
                        : <span className="text-[var(--text-3)]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-3)]">{entry.submittedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'questions' && (
        <div className="card p-5 rounded-xl">
          <h3 className="font-semibold text-[var(--text-1)] mb-4">Tỉ lệ trả lời đúng theo câu hỏi</h3>
          <div className="mb-3 flex gap-4 text-xs text-[var(--text-3)]">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"/> ≥ 70% dễ</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"/> 40–70% TB</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"/> &lt; 40% khó</span>
          </div>
          {stats.questionStats?.length === 0
            ? <div className="text-center text-[var(--text-3)] py-8">Chưa có dữ liệu</div>
            : <BarChart data={stats.questionStats} />}
        </div>
      )}
    </div>
  )
}
