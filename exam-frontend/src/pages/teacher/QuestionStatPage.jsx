import { useState, useEffect } from 'react'
import { courseApi } from '../../api/services'
import api from '../../api/client'
import { useTranslation } from 'react-i18next'
import Pagination from '../../components/common/Pagination'

const FLAG_META = (t) => ({
  TOO_EASY: { label: t('questionStat.flagTooEasy'),  cls: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' },
  TOO_HARD: { label: t('questionStat.flagTooHard'), cls: 'bg-red-500/15 text-red-400 border border-red-500/30' },
  OK:       { label: t('questionStat.flagOk'), cls: 'bg-green-500/15 text-green-400 border border-green-500/30' },
})
const DIFF_META = (t) => ({
  EASY:   { label: t('questionStat.easy'),   cls: 'text-green-400' },
  MEDIUM: { label: t('questionStat.medium'),   cls: 'text-blue-400'  },
  HARD:   { label: t('questionStat.hard'),  cls: 'text-red-400'   },
})
const TYPE_META = (t) => ({
  MULTIPLE_CHOICE: t('questionStat.multipleChoice'),
  TRUE_FALSE:      t('questionStat.trueFalse'),
  ESSAY:           t('questionStat.essay'),
})

function CorrectRateBar({ rate }) {
  const pct = Math.round(rate * 100)
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#eab308' : '#ef4444'
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-mono w-10 text-right shrink-0" style={{ color }}>{pct}%</span>
    </div>
  )
}

export default function QuestionStatPage() {
  const { t } = useTranslation()
  const [courses, setCourses]   = useState([])
  const [courseId, setCourseId] = useState('')
  const [stats, setStats]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [flagFilter, setFlagFilter] = useState('ALL') // ALL | OK | TOO_EASY | TOO_HARD
  const [sortBy, setSortBy]     = useState('rate_asc') // rate_asc | rate_desc | attempts
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const pageSize = 10

  useEffect(() => {
    courseApi.getAll()
      .then(r => {
        const list = r.data.data || []
        setCourses(list)
        if (list.length > 0) setCourseId(String(list[0].id))
      })
      .catch(() => {})
  }, [])

  const loadStats = () => {
    if (!courseId) return
    setLoading(true)
    setCurrentPage(0) // Reset to first page when loading new data
    api.get(`/questions/stats/course/${courseId}`)
      .then(r => setStats(r.data.data || []))
      .catch(() => setStats([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadStats()
  }, [courseId])

  const filtered = stats
    .filter(s => flagFilter === 'ALL' || s.difficultyFlag === flagFilter)
    .sort((a, b) => {
      if (sortBy === 'rate_asc')  return a.correctRate - b.correctRate
      if (sortBy === 'rate_desc') return b.correctRate - a.correctRate
      return b.totalAttempts - a.totalAttempts
    })

  // Pagination calculations
  const totalElements = filtered.length
  const totalPages = Math.ceil(totalElements / pageSize)
  const startIndex = currentPage * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = filtered.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0)
  }, [flagFilter, sortBy])

  const tooHard = stats.filter(s => s.difficultyFlag === 'TOO_HARD').length
  const tooEasy = stats.filter(s => s.difficultyFlag === 'TOO_EASY').length
  const avgRate  = stats.length ? Math.round(stats.reduce((s, q) => s + q.correctRate, 0) / stats.length * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">{t('questionStat.title')}</h1>
          <p className="page-subtitle">{t('questionStat.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="input-field w-56" value={courseId} onChange={e => setCourseId(e.target.value)}>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={loadStats} disabled={loading || !courseId}
            className="btn-secondary flex items-center gap-2 text-sm"
            title="Làm mới dữ liệu">
            {loading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            )}
            {t('questionStat.refresh')}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card text-center">
            <div className="text-2xl font-bold text-[var(--text-1)]">{stats.length}</div>
            <div className="text-xs text-[var(--text-3)] mt-1">{t('questionStat.questionsWithData')}</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-[var(--accent)]">{avgRate}%</div>
            <div className="text-xs text-[var(--text-3)] mt-1">{t('questionStat.avgCorrectRate')}</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-red-400">{tooHard}</div>
            <div className="text-xs text-[var(--text-3)] mt-1">{t('questionStat.tooHard')}</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-yellow-400">{tooEasy}</div>
            <div className="text-xs text-[var(--text-3)] mt-1">{t('questionStat.tooEasy')}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="flex gap-3 flex-wrap">
          {/* Flag filter */}
          <div className="flex gap-1 bg-[var(--bg-elevated)] border border-[var(--border-base)] rounded-lg p-1">
            {[['ALL',t('questionStat.all')], ['OK',t('questionStat.normal')], ['TOO_HARD',t('questionStat.veryHard')], ['TOO_EASY',t('questionStat.veryEasy')]].map(([v, l]) => (
              <button key={v} onClick={() => setFlagFilter(v)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  flagFilter === v ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
                }`}>{l}
              </button>
            ))}
          </div>
          {/* Sort — rõ ràng hơn dropdown */}
          <div className="flex gap-1 bg-[var(--bg-elevated)] border border-[var(--border-base)] rounded-lg p-1">
            <span className="px-2 py-1 text-xs text-[var(--text-3)] self-center">{t('questionStat.sort')}</span>
            {[
              ['rate_asc',  t('questionStat.hardestFirst')],
              ['rate_desc', t('questionStat.easiestFirst')],
              ['attempts',  t('questionStat.mostAttempts')],
            ].map(([v, l]) => (
              <button key={v} onClick={() => setSortBy(v)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  sortBy === v ? 'bg-[var(--bg-surface)] text-[var(--text-1)] shadow-sm' : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
                }`}>{l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin"/>
        </div>
      ) : !courseId ? (
        <div className="card text-center py-16 text-[var(--text-3)]">{t('questionStat.selectCourse')}</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-[var(--text-3)]">
            {stats.length === 0
              ? t('questionStat.noData')
              : t('questionStat.noMatching')}
          </p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-base)] bg-[var(--bg-elevated)]">
                  <th className="text-left px-4 py-3 text-[var(--text-3)] font-medium w-8">{t('questionStat.number')}</th>
                  <th className="text-left px-4 py-3 text-[var(--text-3)] font-medium">{t('questionStat.question')}</th>
                  <th className="text-center px-3 py-3 text-[var(--text-3)] font-medium w-24">{t('questionStat.type')}</th>
                  <th className="text-center px-3 py-3 text-[var(--text-3)] font-medium w-16">{t('questionStat.difficulty')}</th>
                  <th className="text-center px-3 py-3 text-[var(--text-3)] font-medium w-20">{t('questionStat.attempts')}</th>
                  <th className="text-left px-4 py-3 text-[var(--text-3)] font-medium w-48">{t('questionStat.correctRate')}</th>
                  <th className="text-center px-3 py-3 text-[var(--text-3)] font-medium w-28">{t('questionStat.evaluation')}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((q, i) => {
                  const flag = FLAG_META(t)[q.difficultyFlag] || FLAG_META(t).OK
                  const diff = DIFF_META(t)[q.difficulty] || {}
                  const globalIndex = startIndex + i + 1 // Global row number
                  return (
                    <tr key={q.questionId} className="border-b border-[var(--border-base)] hover:bg-[var(--bg-elevated)] transition-colors">
                      <td className="px-4 py-3 text-[var(--text-3)] text-xs">{globalIndex}</td>
                      <td className="px-4 py-3">
                        <p className="text-[var(--text-1)] line-clamp-2">{q.questionContent}</p>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs text-[var(--text-3)]">{TYPE_META(t)[q.questionType] || q.questionType}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-xs font-medium ${diff.cls}`}>{diff.label}</span>
                      </td>
                      <td className="px-3 py-3 text-center text-[var(--text-2)] font-mono text-xs">{q.totalAttempts}</td>
                      <td className="px-4 py-3"><CorrectRateBar rate={q.correctRate} /></td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${flag.cls}`}>{flag.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            size={pageSize}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  )
}
