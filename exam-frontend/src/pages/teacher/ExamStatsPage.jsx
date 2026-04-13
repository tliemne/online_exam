import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { useTranslation } from 'react-i18next'
import ReactApexChart from 'react-apexcharts'

// ── Mini chart components (thuần SVG, không cần recharts) ──────────────────

function PieChart({ passCount, failCount, t }) {
  const total = passCount + failCount
  if (total === 0) return <div className="text-center text-[var(--text-3)] py-8">{t('stats.noData')}</div>
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
        <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--text-3)" fontSize="11">{t('stats.passRate')}</text>
      </svg>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block"/>
          <span className="text-sm text-[var(--text-2)]">{t('stats.passed')}: <b className="text-green-400">{passCount}</b></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block"/>
          <span className="text-sm text-[var(--text-2)]">{t('stats.failed')}: <b className="text-red-400">{failCount}</b></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"/>
          <span className="text-sm text-[var(--text-2)]">{t('stats.students')}: <b className="text-blue-400">{total}</b></span>
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
  const toast      = useToast()
  const { t }      = useTranslation()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [tab, setTab] = useState('overview') // overview | leaderboard | questions

  useEffect(() => {
    api.get(`/exam-stats/${examId}`)
      .then(r => setStats(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [examId])

  const handleExport = async () => {
    setExporting(true)
    try {
      const resp = await api.get(`/attempts/exams/${examId}/export`, { responseType: 'blob' })
      const url  = URL.createObjectURL(new Blob([resp.data]))
      const link = document.createElement('a')
      link.href     = url
      link.download = `ket-qua-${stats?.examTitle?.replace(/\s+/g, '-') ?? examId}.xlsx`
      link.click()
      URL.revokeObjectURL(url)
      toast.success(t('grading.exportSuccess'))
    } catch {
      toast.error(t('grading.exportError'))
    } finally {
      setExporting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"/>
    </div>
  )
  if (!stats) return <div className="p-8 text-center text-[var(--text-3)]">{t('stats.noData')}</div>

  const tabs = [
    { id: 'overview',    label: t('stats.title') },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'questions',   label: t('questionStat.title') },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-[var(--text-3)] hover:text-[var(--text-1)] mb-1 flex items-center gap-1">
            ← {t('common.back')}
          </button>
          <h1 className="text-2xl font-bold text-[var(--text-1)]">{t('stats.title')}</h1>
          <p className="text-[var(--text-3)] mt-1">{stats.examTitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {stats.totalAttempts === 0 && (
            <div className="px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
              {t('grading.noSubmissions')}
            </div>
          )}
          {stats.totalAttempts > 0 && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              {exporting ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              )}
              {exporting ? t('grading.exporting') : t('grading.exportExcel')}
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('stats.attempts'), value: stats.totalAttempts, color: 'text-blue-400' },
          { label: t('stats.averageScore'), value: stats.avgScore?.toFixed(1) ?? '—', sub: `/ ${stats.totalScoreMax}`, color: 'text-purple-400' },
          { label: t('stats.passRate'), value: `${stats.passRate}%`, color: stats.passRate >= 50 ? 'text-green-400' : 'text-red-400' },
          { label: t('stats.highestScore'), value: stats.maxScore?.toFixed(1) ?? '—', sub: `${t('stats.lowestScore')}: ${stats.minScore?.toFixed(1) ?? '—'}`, color: 'text-yellow-400' },
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
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card lg:col-span-2">
            <p className="font-bold" style={{ color:'var(--text-1)' }}>{t('stats.distribution')}</p>
            <p className="text-xs mt-0.5 mb-4" style={{ color:'var(--text-3)' }}>{t('stats.byDifficulty')}</p>
            {stats.scoreDistribution && stats.scoreDistribution.length > 0 ? (
              <div className="space-y-3">
                {stats.scoreDistribution.map((bucket, i) => {
                  const maxCount = Math.max(...stats.scoreDistribution.map(d => d.count), 1)
                  const colors = ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-[var(--text-3)] w-16 text-right shrink-0">{bucket.label}</span>
                      <div className="flex-1 h-8 bg-[var(--bg-elevated)] rounded overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-500 flex items-center justify-end pr-2"
                          style={{ 
                            width: `${(bucket.count / maxCount) * 100}%`, 
                            backgroundColor: colors[i % colors.length],
                            minWidth: bucket.count > 0 ? '2rem' : 0 
                          }}
                        >
                          {bucket.count > 0 && <span className="text-white text-xs font-bold">{bucket.count}</span>}
                        </div>
                      </div>
                      <span className="text-xs text-[var(--text-3)] w-8">{bucket.count}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-sm" style={{ color:'var(--text-3)' }}>
                {t('stats.noData')}
              </div>
            )}
          </div>
          <div className="card flex flex-col">
            <p className="font-bold" style={{ color:'var(--text-1)' }}>{t('stats.passRate')}</p>
            <p className="text-xs mt-0.5 mb-2" style={{ color:'var(--text-3)' }}>{t('stats.graded')}</p>
            <div className="flex-1 flex items-center justify-center">
              {stats.passCount !== undefined && stats.failCount !== undefined ? (
                <ReactApexChart 
                  type="donut" 
                  height={200} 
                  width="100%" 
                  series={[stats.passCount, stats.failCount]} 
                  options={{
                    chart: { background: 'transparent' },
                    theme: { mode: document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark' },
                    labels: [t('stats.passed'), t('stats.failed')],
                    colors: ['#22c55e', '#ef4444'],
                    legend: { show: false },
                    dataLabels: { enabled: false },
                    stroke: { width: 0 },
                    plotOptions: { pie: { donut: { size: '68%' } } },
                    tooltip: { theme: 'dark' },
                  }}
                />
              ) : (
                <div style={{ color:'var(--text-3)' }}>{t('stats.noData')}</div>
              )}
            </div>
            <div className="flex justify-center gap-6 mt-2">
              {[['var(--success)',t('stats.passed'),stats.passCount??0],['var(--danger)',t('stats.failed'),stats.failCount??0]].map(([c,l,v])=>(
                <div key={l} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{background:c}}/>
                  <span className="text-xs" style={{color:'var(--text-2)'}}>{l}: <b>{v}</b></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'leaderboard' && (
        <div className="card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-1)]">Top {stats.leaderboard?.length} {t('stats.students')} {t('stats.highestScore')}</h3>
          </div>
          {stats.leaderboard?.length === 0
            ? <div className="p-8 text-center text-[var(--text-3)]">{t('stats.noData')}</div>
            : (
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-1)]">
                <tr>
                  {['#', t('grading.student'), t('user.username'), t('grading.score'), t('grading.status'), t('grading.violations'), t('grading.submittedAt')].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-[var(--text-3)] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.leaderboard.map((entry, i) => (
                  <tr key={entry.studentId} className={`border-t border-[var(--border)] ${i < 3 ? 'bg-yellow-500/5' : ''}`}>
                    <td className="px-4 py-3 font-bold">
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          i === 0
                            ? "bg-yellow-100 text-yellow-700"
                            : i === 1
                            ? "bg-gray-100 text-gray-600"
                            : i === 2
                            ? "bg-orange-100 text-orange-600"
                            : "text-[var(--text-3)]"
                        }`}
                      >
                        {entry.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--text-1)]">{entry.studentName}</td>
                    <td className="px-4 py-3 text-[var(--text-3)]">{entry.studentCode || '—'}</td>
                    <td className="px-4 py-3 font-bold text-blue-400">{entry.score?.toFixed(1)} / {entry.totalScore}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        entry.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>{entry.passed ? t('stats.passed') : t('stats.failed')}</span>
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
          <h3 className="font-semibold text-[var(--text-1)] mb-4">{t('questionStat.correctRate')} {t('questionStat.byType')}</h3>
          <div className="mb-3 flex gap-4 text-xs text-[var(--text-3)]">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"/> ≥ 70% {t('question.easy')}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"/> 40–70% {t('question.medium')}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"/> &lt; 40% {t('question.hard')}</span>
          </div>
          {stats.questionStats?.length === 0
            ? <div className="text-center text-[var(--text-3)] py-8">{t('stats.noData')}</div>
            : <BarChart data={stats.questionStats} />}
        </div>
      )}
    </div>
  )
}
