import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'

function PieChart({ passCount, failCount }) {
  const total = passCount + failCount
  if (total === 0) return null
  const passAngle = (passCount / total) * 360
  const r = 55, cx = 70, cy = 70
  const toRad = d => (d - 90) * Math.PI / 180
  const x1 = cx + r * Math.cos(toRad(0)), y1 = cy + r * Math.sin(toRad(0))
  const x2 = cx + r * Math.cos(toRad(passAngle)), y2 = cy + r * Math.sin(toRad(passAngle))
  const large = passAngle > 180 ? 1 : 0
  const passPath = total === passCount
    ? `M ${cx} ${cy-r} A ${r} ${r} 0 1 1 ${cx-0.01} ${cy-r} Z`
    : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
  const failPath = total === failCount
    ? `M ${cx} ${cy-r} A ${r} ${r} 0 1 1 ${cx-0.01} ${cy-r} Z`
    : `M ${cx} ${cy} L ${x2} ${y2} A ${r} ${r} 0 ${1-large} 1 ${x1} ${y1} Z`
  return (
    <svg width="140" height="140">
      {passCount > 0 && <path d={passPath} fill="#22c55e" />}
      {failCount > 0 && <path d={failPath} fill="#ef4444" />}
      <circle cx={cx} cy={cy} r={r*0.5} fill="var(--bg-card)" />
      <text x={cx} y={cy-4} textAnchor="middle" fill="var(--text-1)" fontSize="13" fontWeight="bold">{Math.round(passCount/total*100)}%</text>
      <text x={cx} y={cy+11} textAnchor="middle" fill="var(--text-3)" fontSize="9">đạt</text>
    </svg>
  )
}

export default function ExamLeaderboardPage() {
  const { examId } = useParams()
  const navigate   = useNavigate()
  const { user }   = useAuth()
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/exam-stats/${examId}/leaderboard`)
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

  const myEntry = stats.leaderboard?.find(e => e.studentId === user?.id)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <button onClick={() => navigate(-1)} className="text-sm text-[var(--text-3)] hover:text-[var(--text-1)] mb-1 flex items-center gap-1">
          ← Quay lại
        </button>
        <h1 className="text-2xl font-bold text-[var(--text-1)]">Bảng xếp hạng</h1>
        <p className="text-[var(--text-3)]">{stats.examTitle}</p>
      </div>

      {/* Card của tôi */}
      {myEntry && (
        <div className={`p-5 rounded-xl border-2 ${
          myEntry.passed ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'
        }`}>
          <p className="text-sm text-[var(--text-3)] mb-1">Kết quả của bạn</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-[var(--text-1)]">{myEntry.score?.toFixed(1)} <span className="text-base text-[var(--text-3)]">/ {myEntry.totalScore}</span></p>
              <span className={`mt-1 inline-block px-3 py-0.5 rounded-full text-sm font-semibold ${
                myEntry.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>{myEntry.passed ? '✓ Đạt' : '✗ Trượt'}</span>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black text-[var(--accent)]">#{myEntry.rank}</p>
              <p className="text-xs text-[var(--text-3)]">xếp hạng</p>
            </div>
          </div>
        </div>
      )}

      {/* Tổng quan lớp */}
      <div className="card p-5 rounded-xl">
        <h3 className="font-semibold text-[var(--text-1)] mb-4">Thống kê lớp</h3>
        <div className="flex items-center gap-6">
          <PieChart passCount={stats.passCount} failCount={stats.failCount} />
          <div className="grid grid-cols-2 gap-3 flex-1">
            {[
              { label: 'Lượt thi', value: stats.totalAttempts, color: 'text-blue-400' },
              { label: 'Điểm TB', value: stats.avgScore?.toFixed(1), color: 'text-purple-400' },
              { label: 'Đạt', value: stats.passCount, color: 'text-green-400' },
              { label: 'Trượt', value: stats.failCount, color: 'text-red-400' },
            ].map((c, i) => (
              <div key={i} className="bg-[var(--bg-1)] p-3 rounded-lg">
                <p className="text-xs text-[var(--text-3)]">{c.label}</p>
                <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard table */}
      <div className="card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--text-1)]">Top {stats.leaderboard?.length} sinh viên</h3>
        </div>
        {stats.leaderboard?.length === 0
          ? <div className="p-8 text-center text-[var(--text-3)]">Chưa có dữ liệu</div>
          : (
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-1)]">
              <tr>
                {['#', 'Sinh viên', 'Điểm', 'Kết quả'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-[var(--text-3)] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.leaderboard.map((entry, i) => (
                <tr key={entry.studentId}
                  className={`border-t border-[var(--border)] transition-colors
                    ${entry.studentId === user?.id ? 'bg-[var(--accent)]/10 font-semibold' : ''}
                    ${i < 3 ? 'bg-yellow-500/5' : ''}
                  `}>
                  <td className="px-4 py-3 font-bold text-[var(--text-3)]">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : entry.rank}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-1)]">
                    {entry.studentName}
                    {entry.studentId === user?.id && <span className="ml-2 text-xs text-[var(--accent)]">(bạn)</span>}
                  </td>
                  <td className="px-4 py-3 font-bold text-blue-400">{entry.score?.toFixed(1)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      entry.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>{entry.passed ? 'Đạt' : 'Trượt'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
