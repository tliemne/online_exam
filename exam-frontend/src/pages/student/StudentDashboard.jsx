import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { attemptApi } from '../../api/services'
import api from '../../api/client'

// ── Wave score chart ───────────────────────────────────────
import ReactApexChart from 'react-apexcharts'

// ── SVG Icons ─────────────────────────────────────────────
const IcoCourses  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>
const IcoExams    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>
const IcoResults  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
const IcoPassed   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"/></svg>
const IcoScore    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"/></svg>
const IcoSchedule = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>
const IcoRanking  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"/></svg>
const IcoPost = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/></svg>
const IcoReply = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/></svg>
const IcoLike = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z"/></svg>
const IcoTrophy = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"/></svg>

// ── Skeleton ──────────────────────────────────────────────
function Sk({ h='h-8', w='w-full' }) {
  return <div className={`${w} ${h} rounded-2xl animate-pulse`} style={{ background:'var(--bg-elevated)' }}/>
}

// ── Stat Card ─────────────────────────────────────────────
function StatCard({ label, value, icon, color, loading }) {
  return (
    <div className="card p-5 flex flex-col gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: color+'20', color }}>
        {icon}
      </div>
      {loading ? <Sk h="h-8" w="w-20"/> :
        <p className="font-bold text-3xl tracking-tight" style={{ color:'var(--text-1)' }}>{value ?? 0}</p>
      }
      <p className="text-sm font-semibold" style={{ color:'var(--text-2)' }}>{label}</p>
    </div>
  )
}

// ── ApexCharts helpers ────────────────────────────────────
const getTheme = () => document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
const LC = '#A3AED0'

const lineOpts = (labels) => ({
  chart: { toolbar:{show:false}, background:'transparent', fontFamily:'DM Sans, sans-serif' },
  theme: { mode: getTheme() },
  stroke: { curve:'smooth', width:3 },
  fill: { type:'gradient', gradient:{ type:'vertical', opacityFrom:0.2, opacityTo:0 } },
  markers: { size:0, hover:{ size:6 } },
  xaxis: {
    categories: labels,
    labels: { style:{ colors:LC, fontSize:'11px' }, formatter: v => v?.length>12 ? v.slice(0,12)+'…':v },
    axisBorder:{show:false}, axisTicks:{show:false}, tooltip:{enabled:false},
  },
  yaxis: { labels:{ style:{ colors:LC, fontSize:'11px' } } },
  grid: { borderColor:'rgba(163,174,208,0.12)', strokeDashArray:4, xaxis:{ lines:{show:false} } },
  tooltip: { theme:getTheme(), style:{ fontSize:'13px', fontFamily:'DM Sans, sans-serif' }, x:{show:true} },
  colors: ['#7551FF'], dataLabels:{enabled:false},
})

const donutOpts = (pct) => {
  const clr = pct>=70?'#01B574':pct>=50?'#FFB547':'#EE5D50'
  const dark = getTheme()==='dark'
  return {
    chart: { background:'transparent', fontFamily:'DM Sans, sans-serif' },
    theme: { mode:getTheme() },
    colors: [clr, dark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.06)'],
    labels: ['Đạt','Chưa đạt'],
    plotOptions: { pie: { donut: { size:'72%', labels: {
      show:true,
      name: { show:true, fontSize:'12px', color:LC, offsetY:-4 },
      value: { show:true, fontSize:'24px', fontWeight:700, color:clr, offsetY:4, formatter:v=>`${Math.round(+v)}%` },
      total: { show:true, label:'Tỉ lệ đạt', fontSize:'12px', color:LC, formatter:()=>`${Math.round(pct)}%` },
    } } } },
    legend:{show:false}, dataLabels:{enabled:false}, stroke:{width:0},
    tooltip: { theme:getTheme(), style:{ fontSize:'13px' } },
  }
}

function PracticeModal({ topic, difficulty, onClose }) {
  const [questions, setQuestions]   = useState([])
  const [loading, setLoading]       = useState(false)
  const [answers, setAnswers]       = useState({})
  const [submitted, setSubmitted]   = useState(false)
  const [score, setScore]           = useState(null)
  const [error, setError]           = useState('')
  const [count, setCount]           = useState(3)
  const [diff, setDiff]             = useState('ALL')
  const [qtype, setQtype]           = useState('ALL')
  const [started, setStarted]       = useState(false)

  const handleStart = () => {
    setStarted(true)
    setLoading(true)
    api.post('/questions/ai-generate', {
      topic, type: qtype, difficulty: diff, count,
      courseId: null, tags: null,
      bustCache: true,
    })
      .then(r => {
        const qs = r.data.data || []
        if (qs.length === 0) setError('AI không tạo được câu hỏi. Thử lại sau ít phút.')
        else setQuestions(qs)
      })
      .catch(err => {
        const status = err.response?.status
        if (status === 503) {
          setError('AI đang quá tải. Vui lòng thử lại sau 1-2 phút.')
        } else if (status === 429) {
          setError('Đã vượt giới hạn API. Thử lại sau vài phút.')
        } else {
          setError('Không tạo được bài luyện. Thử lại sau.')
        }
        setStarted(false) // Cho phép thử lại
      })
      .finally(() => setLoading(false))
  }

  const [grading, setGrading]       = useState(false)
  const [essayGrades, setEssayGrades] = useState({}) // qi → {score, feedback, level}

  const handleSubmit = async () => {
    // 1. Chấm MCQ/TF ngay
    let correct = 0
    const hasEssay = questions.some(q => q.type === 'ESSAY')
    const nonEssayCount = questions.filter(q => q.type !== 'ESSAY').length
    questions.forEach((q, i) => {
      if (q.type === 'ESSAY') return
      const chosen = answers[i]
      if (chosen != null && q.answers[chosen]?.correct) correct++
    })
    setScore({ correct, total: nonEssayCount, hasEssay })
    setSubmitted(true)

    // 2. Gọi AI chấm essay song song
    const essayIdxs = questions.map((q, i) => q.type === 'ESSAY' ? i : -1).filter(i => i >= 0)
    if (essayIdxs.length > 0) {
      setGrading(true)
      try {
        const results = await Promise.all(essayIdxs.map(qi =>
          api.post('/attempts/ai-grade-essay', {
            question: questions[qi].content,
            studentAnswer: answers[qi] || '',
            suggestedAnswer: questions[qi].explanation || '',
          }).then(r => ({ qi, data: r.data.data })).catch(() => ({ qi, data: null }))
        ))
        const grades = {}
        results.forEach(({ qi, data }) => { if (data) grades[qi] = data })
        setEssayGrades(grades)
      } finally { setGrading(false) }
    }
  }

  const DIFF_LABEL = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó', ALL: 'Ngẫu nhiên' }
  const TYPE_LABEL = { MULTIPLE_CHOICE: 'Trắc nghiệm', TRUE_FALSE: 'Đúng/Sai', ESSAY: 'Tự luận', ALL: 'Hỗn hợp' }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-xl border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-base)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0"
          style={{ borderColor: 'var(--border-base)', background: 'var(--bg-surface)' }}>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-1)' }}>Luyện tập: {topic}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              {started ? `${TYPE_LABEL[qtype]} · ${DIFF_LABEL[diff]} · ${count} câu · AI tạo` : 'Cấu hình bài luyện'}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Config screen */}
          {!started && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="input-label">Loại câu</label>
                  <select className="input-field" value={qtype} onChange={e => setQtype(e.target.value)}>
                    <option value="ALL">Tất cả</option>
                    <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                    <option value="TRUE_FALSE">Đúng/Sai</option>
                    <option value="ESSAY">Tự luận</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Độ khó</label>
                  <select className="input-field" value={diff} onChange={e => setDiff(e.target.value)}>
                    <option value="ALL">Tất cả</option>
                    <option value="EASY">Dễ</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HARD">Khó</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Số câu</label>
                  <input type="number" className="input-field" min={1} max={15}
                    value={count} onChange={e => setCount(+e.target.value)}/>
                </div>
              </div>
              <button onClick={handleStart} className="btn-primary w-full">
                Bắt đầu luyện tập
              </button>
            </div>
          )}
          {loading && (
            <div className="flex flex-col items-center py-10 gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--accent)' }}/>
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>AI đang tạo bài luyện tập...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
              <button onClick={() => { setError(''); setStarted(false) }}
                className="btn-secondary text-sm px-4 py-2">
                Thử lại
              </button>
            </div>
          )}

          {/* Score result */}
          {submitted && score && (
            <div>
              {/* MCQ score */}
              {score.total > 0 && (
                <div className="px-4 py-4 rounded-lg text-center mb-3"
                  style={{ background: score.correct / score.total >= 0.6 ? 'var(--success-subtle)' : 'var(--warning-subtle)' }}>
                  <p className="text-2xl font-bold"
                    style={{ color: score.correct / score.total >= 0.6 ? 'var(--success)' : 'var(--warning)' }}>
                    {score.correct}/{score.total}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
                    {score.correct / score.total >= 0.8 ? 'Xuất sắc! Bạn đã nắm vững chủ đề này.'
                      : score.correct / score.total >= 0.6 ? 'Khá tốt! Tiếp tục luyện tập nhé.'
                      : 'Cần ôn lại thêm chủ đề này.'}
                  </p>
                </div>
              )}
              {/* Essay AI grading status */}
              {score.hasEssay && (
                <div className="px-4 py-3 rounded-lg flex items-center gap-3"
                  style={{ background: 'var(--bg-elevated)' }}>
                  {grading
                    ? <><span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin shrink-0"
                        style={{ borderColor: 'var(--purple)' }}/>
                       <span className="text-sm" style={{ color: 'var(--text-2)' }}>AI đang chấm câu tự luận...</span></>
                    : <span className="text-sm" style={{ color: 'var(--text-2)' }}>
                        AI đã chấm {Object.keys(essayGrades).length} câu tự luận — xem kết quả bên dưới
                      </span>}
                </div>
              )}
            </div>
          )}

          {/* Questions */}
          {!loading && questions.map((q, qi) => {
            const chosen = answers[qi]
            return (
              <div key={qi} className="space-y-3">
                <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
                  <span className="text-xs mr-2" style={{ color: 'var(--text-3)' }}>{qi + 1}.</span>
                  {q.content}
                </p>
                {q.type === 'ESSAY' ? (
                  <div className="space-y-2">
                    <textarea
                      disabled={submitted}
                      rows={4}
                      placeholder="Viết câu trả lời của bạn..."
                      value={answers[qi] || ''}
                      onChange={e => setAnswers(p => ({...p, [qi]: e.target.value}))}
                      className="input-field w-full resize-none text-sm"/>
                    {submitted && q.explanation && (
                      <div className="px-3 py-2.5 rounded-lg text-xs space-y-1"
                        style={{ background: 'var(--accent-subtle)' }}>
                        <p className="font-medium" style={{ color: 'var(--accent)' }}>Gợi ý / Tiêu chí chấm:</p>
                        <p style={{ color: 'var(--text-2)' }}>{q.explanation}</p>
                      </div>
                    )}
                    {/* AI essay grade result */}
                    {submitted && essayGrades[qi] && (() => {
                      const g = essayGrades[qi]
                      const lvlClr = g.level === 'EXCELLENT' ? 'var(--success)'
                        : g.level === 'GOOD' ? 'var(--accent)'
                        : g.level === 'AVERAGE' ? 'var(--warning)' : 'var(--danger)'
                      const lvlLabel = { EXCELLENT: 'Xuất sắc', GOOD: 'Khá', AVERAGE: 'Trung bình', POOR: 'Yếu', UNKNOWN: '—' }
                      return (
                        <div className="px-3 py-2.5 rounded-lg space-y-1.5 border"
                          style={{ borderColor: lvlClr + '40', background: lvlClr + '0d' }}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold" style={{ color: lvlClr }}>
                              AI chấm: {g.score}/10 — {lvlLabel[g.level] || g.level}
                            </span>
                          </div>
                          {g.feedback && <p className="text-xs" style={{ color: 'var(--text-2)' }}>{g.feedback}</p>}
                        </div>
                      )
                    })()}
                    {submitted && grading && !essayGrades[qi] && (
                      <div className="flex items-center gap-2 px-3 py-2" style={{ color: 'var(--text-3)' }}>
                        <span className="w-3 h-3 border border-t-transparent rounded-full animate-spin"
                          style={{ borderColor: 'var(--purple)' }}/>
                        <span className="text-xs">AI đang chấm...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {q.answers?.map((a, ai) => {
                      let bg = 'var(--bg-elevated)', clr = 'var(--text-2)', border = 'var(--border-base)'
                      if (submitted) {
                        if (a.correct) { bg = 'var(--success-subtle)'; clr = 'var(--success)'; border = 'var(--success-border)' }
                        else if (chosen === ai && !a.correct) { bg = 'var(--danger-subtle)'; clr = 'var(--danger)'; border = 'var(--danger-border)' }
                      } else if (chosen === ai) {
                        bg = 'var(--accent-subtle)'; clr = 'var(--accent)'; border = 'var(--accent-border)'
                      }
                      return (
                        <button key={ai} disabled={submitted}
                          onClick={() => setAnswers(p => ({...p, [qi]: ai}))}
                          className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all"
                          style={{ background: bg, color: clr, border: `1px solid ${border}` }}>
                          {String.fromCharCode(65 + ai)}. {a.content}
                        </button>
                      )
                    })}
                    {submitted && q.explanation && (
                      <p className="text-xs px-3 py-2 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-3)' }}>
                        {q.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Actions */}
          {!loading && !submitted && questions.length > 0 && (
            <button onClick={handleSubmit}
              disabled={Object.keys(answers).length < questions.length}
              className="btn-primary w-full">
              Nộp bài ({Object.keys(answers).length}/{questions.length} câu)
            </button>
          )}
          {submitted && (
            <button onClick={onClose} className="btn-secondary w-full">Đóng</button>
          )}
        </div>
      </div>
    </div>
  )
}

function WeaknessWidget() {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [open, setOpen]         = useState(false)
  const [practice, setPractice] = useState(null)

  const load = async () => {
    if (data) { setOpen(true); return }
    setLoading(true)
    try {
      const r = await attemptApi.aiWeakness()
      setData(r.data.data)
      setOpen(true)
    } catch {} finally { setLoading(false) }
  }

  const refresh = async () => {
    setRefreshing(true)
    try {
      await api.delete('/attempts/ai-weakness/cache')
      const r = await attemptApi.aiWeakness()
      setData(r.data.data)
    } catch {} finally { setRefreshing(false) }
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
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Powered by Gemini AI · Cache 30 phút</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={refresh} disabled={refreshing}
                  className="btn-ghost p-1.5 text-xs"
                  style={{ color: 'var(--text-3)' }}
                  title="Phân tích lại">
                  {refreshing
                    ? <span className="w-3 h-3 border border-t-transparent rounded-full animate-spin inline-block" style={{ borderColor: 'var(--text-3)' }}/>
                    : '↻'}
                </button>
                <button onClick={() => setOpen(false)} className="btn-ghost p-1.5">✕</button>
              </div>
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

                {/* Chọn chủ đề luyện tập - luôn hiện dù AI fail */}
                {data.topics?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-3)' }}>
                      CHỌN CHỦ ĐỀ ĐỂ LUYỆN TẬP
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {data.topics.map((t, i) => {
                        const clr = t.correctPct >= 70 ? 'var(--success)' : t.correctPct >= 50 ? 'var(--warning)' : 'var(--danger)'
                        const diff = t.correctPct < 50 ? 'EASY' : t.correctPct < 70 ? 'MEDIUM' : 'HARD'
                        return (
                          <button key={i}
                            onClick={() => setPractice({ topic: t.topic, difficulty: diff })}
                            className="text-left p-3 rounded-lg border transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)]"
                            style={{ borderColor: 'var(--border-base)' }}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium truncate" style={{ color: 'var(--text-1)' }}>{t.topic}</span>
                              <span className="text-[10px] font-mono ml-1 shrink-0" style={{ color: clr }}>{t.correctPct}%</span>
                            </div>
                            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-base)' }}>
                              <div className="h-full rounded-full" style={{ width: `${t.correctPct}%`, background: clr }}/>
                            </div>
                            <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-3)' }}>
                              {t.correctPct < 50 ? '⚡ Cần ôn gấp' : t.correctPct < 70 ? '📚 Cần luyện thêm' : '✓ Đang tốt'}
                            </p>
                          </button>
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
      {practice && (
        <PracticeModal
          topic={practice.topic}
          difficulty={practice.difficulty}
          onClose={() => setPractice(null)}
        />
      )}
    </>
  )
}

// ── Main ──────────────────────────────────────────────────
export default function StudentDashboard() {
  const { user }              = useAuth()
  const { t }                 = useTranslation()
  const navigate              = useNavigate()
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [discussionStats, setDiscussionStats] = useState(null)
  const [discussionLoading, setDiscussionLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/student')
      .then(r => setStats(r.data.data))
      .catch(e => setError(e?.response?.data?.message || t('messages.loadingFailed')))
      .finally(() => setLoading(false))
    
    // Load discussion stats
    api.get('/dashboard/discussion/student')
      .then(r => setDiscussionStats(r.data.data))
      .catch(e => console.error('Failed to load discussion stats:', e))
      .finally(() => setDiscussionLoading(false))
  }, [])

  const passRate = stats?.completedAttempts > 0
    ? Math.round((stats.passedAttempts / stats.completedAttempts) * 100)
    : 0

  const avgColor = stats?.avgScore >= 8 ? 'var(--success)'
    : stats?.avgScore >= 5 ? 'var(--warning)' : 'var(--danger)'

  // Line chart data from recent attempts
  const recentLabels = stats?.recentAttempts?.map(a => a.examTitle?.slice(0,10) || '') ?? []
  const recentScores = stats?.recentAttempts?.map(a => +(a.score?.toFixed(1) ?? 0)) ?? []

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="page-title">{t('nav.dashboard')}</h1>
        <p className="page-subtitle">{t('common.hello')}, <span className="font-bold" style={{ color:'var(--text-2)' }}>{user?.fullName || user?.username}</span></p>
      </div>

      {error && <div className="px-5 py-4 rounded-2xl text-sm" style={{ background:'var(--danger-subtle)', color:'var(--danger)', border:'1px solid var(--danger-border)' }}>{error}</div>}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:t('student.myCourses'),   value:stats?.enrolledCourses,   icon:<IcoCourses/>,  color:'var(--accent)'  },
          { label:t('exam.noExams'),  value:stats?.availableExams,    icon:<IcoExams/>,    color:'var(--purple)'  },
          { label:t('attempt.submitted'),     value:stats?.completedAttempts, icon:<IcoResults/>,  color:'var(--cyan)'    },
          { label:t('attempt.passed'),        value:stats?.passedAttempts,    icon:<IcoPassed/>,   color:'var(--success)' },
        ].map(s => <StatCard key={s.label} {...s} loading={loading}/>)}
      </div>

      {/* Discussion Activity Section - Gamification */}
      {!discussionLoading && discussionStats && (
        <div>
          <p className="text-xs font-semibold mb-3 px-1" style={{ color: 'var(--text-3)' }}>
            💬 HOẠT ĐỘNG THẢO LUẬN
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { 
                label: 'Bài viết của tôi', 
                value: discussionStats.myPosts, 
                icon: <IcoPost/>, 
                color: '#7551FF',
                sub: `Bạn đã đóng góp ${discussionStats.myPosts} câu hỏi`,
                gradient: 'linear-gradient(135deg, #7551FF 0%, #9575FF 100%)'
              },
              { 
                label: 'Phản hồi của tôi', 
                value: discussionStats.myReplies, 
                icon: <IcoReply/>, 
                color: '#16a34a',
                sub: `Bạn đã giúp đỡ ${discussionStats.myReplies} lần`,
                gradient: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)'
              },
              { 
                label: 'Likes nhận được', 
                value: discussionStats.totalLikes, 
                icon: <IcoLike/>, 
                color: '#ec4899',
                sub: `Cộng đồng đánh giá cao ${discussionStats.totalLikes} đóng góp`,
                gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)'
              },
              { 
                label: 'Xếp hạng của bạn', 
                value: `#${discussionStats.myRank}`, 
                icon: <IcoTrophy/>, 
                color: '#d97706',
                sub: `Top ${discussionStats.percentage}% / ${discussionStats.totalStudents} sinh viên`,
                gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                isRank: true
              },
            ].map(s => (
              <div key={s.label} 
                className="card p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                {/* Gradient background on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
                  style={{ background: s.gradient }}/>
                
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                    style={{ background: s.gradient }}>
                    <span className="text-white">{s.icon}</span>
                  </div>
                  <p className="font-bold text-3xl tracking-tight mb-1"
                    style={{ color: 'var(--text-1)' }}>
                    {s.value ?? 0}
                  </p>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-2)' }}>{s.label}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>{s.sub}</p>
                  
                  {s.isRank && discussionStats.myRank <= 10 && (
                    <div className="mt-2 px-2 py-1 rounded-full inline-block text-xs font-bold"
                      style={{ background: s.color + '20', color: s.color }}>
                      🏆 Top 10!
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score line + Donut */}
      {!loading && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Score line chart */}
          <div className="card lg:col-span-2">
            <p className="font-bold" style={{ color:'var(--text-1)' }}>{t('stats.recentExams')}</p>
            <p className="text-xs mt-0.5 mb-4" style={{ color:'var(--text-3)' }}>{t('attempt.resultHistory')}</p>
            {recentScores.length > 0 ? (
              <ReactApexChart type="area" height={180}
                series={[{ name:t('attempt.score'), data:recentScores }]}
                options={lineOpts(recentLabels)}/>
            ) : (
              <div className="flex items-center justify-center h-44 text-sm" style={{ color:'var(--text-3)' }}>
                {t('exam.noExamsInCourse')}
              </div>
            )}
          </div>

          {/* Pass rate donut */}
          <div className="card flex flex-col">
            <p className="font-bold" style={{ color:'var(--text-1)' }}>Tỉ lệ đạt</p>
            <p className="text-xs mt-0.5 mb-2" style={{ color:'var(--text-3)' }}>Trong tất cả bài thi</p>
            <div className="flex-1 flex items-center justify-center">
              <ReactApexChart type="donut" height={200} width="100%"
                series={[passRate, 100-passRate]}
                options={donutOpts(passRate)}/>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              {[['var(--success)','Đạt',passRate],['var(--danger)','Chưa',100-passRate]].map(([c,l,v])=>(
                <div key={l} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{background:c}}/>
                  <span className="text-xs" style={{color:'var(--text-2)'}}> {l}: <b>{v}%</b></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Monthly + Score Distribution Charts */}
      {!loading && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Monthly Attempts */}
          <div className="card">
            <p className="font-bold" style={{ color:'var(--text-1)' }}>Lượt thi theo tháng</p>
            <p className="text-xs mt-0.5 mb-3" style={{ color:'var(--text-3)' }}>6 tháng gần nhất</p>
            {stats.monthlyAttempts && stats.monthlyAttempts.length > 0 ? (
              <ReactApexChart type="bar" height={180}
                series={[{ name: 'Lượt thi', data: stats.monthlyAttempts.map(m => m.count) }]}
                options={{
                  chart: { toolbar: { show: false }, background: 'transparent' },
                  theme: { mode: getTheme() },
                  xaxis: {
                    categories: stats.monthlyAttempts.map(m => m.month),
                    labels: { style: { colors: LC, fontSize: '11px' }, rotate: -45 }
                  },
                  yaxis: { labels: { style: { colors: LC } } },
                  colors: ['var(--accent)'],
                  plotOptions: { bar: { borderRadius: 6, columnWidth: '60%' } },
                  dataLabels: { enabled: false },
                  grid: { borderColor: 'rgba(163,174,208,0.12)', strokeDashArray: 3 },
                  tooltip: { theme: getTheme(), y: { formatter: (val) => `${val} lượt` } }
                }}
              />
            ) : (
              <p className="text-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>Chưa có dữ liệu</p>
            )}
          </div>

          {/* Score Distribution */}
          <div className="card">
            <p className="font-bold" style={{ color:'var(--text-1)' }}>Phân bố điểm</p>
            <p className="text-xs mt-0.5 mb-3" style={{ color:'var(--text-3)' }}>Theo thang điểm 10</p>
            {stats.scoreDistribution ? (
              <ReactApexChart type="donut" height={180}
                series={[
                  stats.scoreDistribution.excellent,
                  stats.scoreDistribution.good,
                  stats.scoreDistribution.fair,
                  stats.scoreDistribution.average,
                  stats.scoreDistribution.poor
                ]}
                options={{
                  chart: { background: 'transparent' },
                  theme: { mode: getTheme() },
                  labels: ['Xuất sắc (9-10)', 'Giỏi (8-9)', 'Khá (7-8)', 'TB (5-7)', 'Yếu (<5)'],
                  colors: ['#16a34a', '#0891b2', '#d97706', '#f59e0b', '#dc2626'],
                  legend: { position: 'bottom', labels: { colors: LC }, fontSize: '11px' },
                  dataLabels: { enabled: true, formatter: (val) => `${val.toFixed(0)}%`, style: { fontSize: '11px' } },
                  stroke: { width: 0 },
                  plotOptions: { pie: { donut: { size: '65%' } } },
                  tooltip: { theme: getTheme(), y: { formatter: (val) => `${val} bài` } }
                }}
              />
            ) : (
              <p className="text-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>Chưa có dữ liệu</p>
            )}
          </div>
        </div>
      )}

      {/* Average score card */}
      {!loading && stats?.avgScore != null && (
        <div className="card p-5 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: avgColor+'20', color: avgColor }}>
            <IcoScore/>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color:'var(--text-2)' }}>Điểm trung bình</p>
            <p className="font-bold text-4xl tracking-tight mt-0.5" style={{ color: avgColor }}>
              {stats.avgScore.toFixed(1)}
              <span className="text-lg font-medium ml-1" style={{ color:'var(--text-3)' }}>/ 10</span>
            </p>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {to:'/student/exams',    label:'Bài kiểm tra', icon:<IcoExams/>,    color:'var(--accent)' },
          {to:'/student/results',  label:'Kết quả',      icon:<IcoResults/>,  color:'var(--success)'},
          {to:'/student/schedule', label:'Lịch thi',     icon:<IcoSchedule/>, color:'var(--purple)' },
          {to:'/student/rankings', label:'Xếp hạng',     icon:<IcoRanking/>,  color:'var(--warning)'},
        ].map(l=>(
          <Link key={l.to} to={l.to} className="card p-4 flex items-center gap-3 no-underline hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{background:l.color+'18',color:l.color}}>{l.icon}</div>
            <span className="text-sm font-bold" style={{color:'var(--text-1)'}}> {l.label}</span>
          </Link>
        ))}
      </div>

      {/* AI Weakness Widget */}
      <div>
        <WeaknessWidget/>
      </div>

      {/* Recent attempts table */}
      {!loading && stats?.recentAttempts?.length > 0 && (
        <div className="card-bare overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom:'1px solid var(--border-base)' }}>
            <p className="font-bold" style={{ color:'var(--text-1)' }}>Bài làm gần đây</p>
            <Link to="/student/results" className="text-sm font-semibold transition-colors" style={{ color:'var(--accent)' }}>Xem tất cả →</Link>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Đề thi','Lớp','Điểm','Kết quả','Nộp lúc'].map(h=>(
                    <th key={h} className="th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentAttempts.map(a => {
                  const pct = a.score!=null && a.totalScore ? (a.score/a.totalScore)*100 : 0
                  const clr = pct>=70?'var(--success)':pct>=50?'var(--warning)':'var(--danger)'
                  return (
                    <tr key={a.attemptId} className="table-row">
                      <td className="td font-semibold" style={{color:'var(--text-1)'}}> {a.examTitle}</td>
                      <td className="td" style={{color:'var(--text-3)'}}> {a.courseName}</td>
                      <td className="td">
                        {a.score!=null ? (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 rounded-full overflow-hidden" style={{width:48,background:'var(--bg-elevated)'}}>
                              <div className="h-full rounded-full" style={{width:`${Math.round(pct)}%`,background:clr}}/>
                            </div>
                            <span className="text-xs font-mono" style={{color:clr}}>{a.score.toFixed(1)}/{a.totalScore}</span>
                          </div>
                        ) : <span style={{color:'var(--text-3)'}}> —</span>}
                      </td>
                      <td className="td">
                        {a.status==='GRADED'
                          ? <span className={a.passed?'badge-green':'badge-red'}>{a.passed?'Đạt':'Chưa đạt'}</span>
                          : <span className="badge-amber">Chờ chấm</span>}
                      </td>
                      <td className="td text-xs" style={{color:'var(--text-3)'}}> {a.submittedAt||'—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
