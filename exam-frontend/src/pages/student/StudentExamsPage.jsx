import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { examApi } from '../../api/services'
import api from '../../api/client'

// ── Icons ─────────────────────────────────────────────────
const Icon = {
  clock:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  doc:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>,
  play:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"/></svg>,
  x:      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  check:  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5"/></svg>,
  warn:   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/></svg>,
}


// ── Result History Modal ──────────────────────────────────
function ResultHistoryModal({ exam, onClose }) {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [detail, setDetail]     = useState(null)  // attempt detail

  useEffect(() => {
    api.get(`/attempts/my/exams/${exam.id}`)
      .then(r => setAttempts(r.data.data || []))
      .catch(() => setAttempts([]))
      .finally(() => setLoading(false))
  }, [exam.id])

  const statusColor = (s) => s === 'GRADED' ? 'text-success' : 'text-warning'
  const statusLabel = (s) => s === 'GRADED' ? 'Đã chấm' : s === 'SUBMITTED' ? 'Chờ chấm' : 'Đang làm'

  if (detail) return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-modal">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="font-semibold text-[var(--text-1)]">Chi tiết bài làm</h3>
            <p className="text-xs text-[var(--text-3)]">{exam.title}</p>
          </div>
          <button onClick={() => setDetail(null)} className="btn-ghost p-2 text-[var(--text-3)]">{Icon.x}</button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Score summary */}
          <div className="bg-[var(--bg-elevated)] rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--text-3)] mb-1">Điểm số</p>
              <p className={`text-2xl font-bold ${detail.passed ? 'text-success' : 'text-danger'}`}>
                {detail.score != null ? `${detail.score}/${detail.totalScore}` : 'Chờ chấm'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--text-3)] mb-1">Kết quả</p>
              <p className={`text-sm font-semibold ${detail.passed ? 'text-success' : detail.passed === false ? 'text-danger' : 'text-warning'}`}>
                {detail.passed == null ? '—' : detail.passed ? 'Đạt' : 'Chưa đạt'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--text-3)] mb-1">Đúng/Tổng</p>
              <p className="text-sm font-semibold text-[var(--text-1)]">{detail.correctCount ?? '?'}/{detail.totalQuestions ?? '?'}</p>
            </div>
          </div>

          {/* Answer details */}
          {(detail.answers || []).map((a, i) => (
            <div key={a.id} className={`border rounded-xl p-4 ${
              a.isCorrect === true  ? 'border-success/30 bg-success/5'
              : a.isCorrect === false ? 'border-danger/30 bg-danger/5'
              : 'border-[var(--border-base)] bg-[var(--bg-elevated)]/30'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-lg bg-[var(--border-base)] flex items-center justify-center text-xs font-mono font-bold text-[var(--text-3)]">{i+1}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--border-base)] text-[var(--text-3)]">{
                  a.questionType === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm'
                  : a.questionType === 'TRUE_FALSE' ? 'Đúng/Sai' : 'Tự luận'
                }</span>
                <span className={`ml-auto text-xs font-medium ${a.isCorrect === true ? 'text-success' : a.isCorrect === false ? 'text-danger' : 'text-warning'}`}>
                  {a.isCorrect === true ? 'Đúng' : a.isCorrect === false ? 'Sai' : 'Chờ chấm'}
                  {a.score != null ? ` · ${a.score}đ` : ''}
                </span>
              </div>
              <p className="text-[var(--text-1)] text-sm mb-2">{a.questionContent}</p>
              {a.selectedAnswerContent && (
                <p className="text-xs text-[var(--text-3)]">Bạn chọn: <span className="text-[var(--text-2)]">{a.selectedAnswerContent}</span></p>
              )}
              {a.textAnswer && (
                <p className="text-xs text-[var(--text-3)]">Câu trả lời: <span className="text-[var(--text-2)]">{a.textAnswer}</span></p>
              )}
              {a.correctAnswerContent && a.isCorrect === false && (
                <p className="text-xs text-success mt-1">Đáp án đúng: {a.correctAnswerContent}</p>
              )}
              {a.teacherComment && (
                <p className="text-xs text-accent mt-1 italic">💬 GV: {a.teacherComment}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-xl w-full max-w-lg shadow-modal">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="font-semibold text-[var(--text-1)]">Lịch sử bài làm</h3>
            <p className="text-xs text-[var(--text-3)]">{exam.title}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 text-[var(--text-3)]">{Icon.x}</button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
            </div>
          ) : attempts.length === 0 ? (
            <p className="text-center text-[var(--text-3)] py-8">Chưa có bài làm nào</p>
          ) : (
            <div className="space-y-3">
              {attempts.map((a, i) => (
                <div key={a.id} className="bg-[var(--bg-elevated)] rounded-xl p-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-[var(--border-base)] flex items-center justify-center text-sm font-bold text-[var(--text-3)] font-mono">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium ${statusColor(a.status)}`}>{statusLabel(a.status)}</span>
                      <span className="text-xs text-[var(--text-3)]">{a.submittedAt ? new Date(a.submittedAt).toLocaleString('vi-VN') : ''}</span>
                    </div>
                    <p className="text-[var(--text-1)] font-semibold text-sm">
                      {a.score != null ? `${a.score}/${a.totalScore} điểm` : 'Chờ chấm tự luận'}
                      {a.passed != null && <span className={`ml-2 text-xs ${a.passed ? 'text-success' : 'text-danger'}`}>{a.passed ? 'Đạt' : 'Chưa đạt'}</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      api.get(`/attempts/${a.id}`).then(r => setDetail(r.data.data))
                    }}
                    className="btn-ghost text-xs px-3 py-1.5 text-accent border border-accent/30 rounded-lg hover:bg-accent/10">
                    Xem chi tiết
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Exam Taking Modal ─────────────────────────────────────
function TakeExamModal({ exam, onClose, onSubmitted }) {
  const navigate = useNavigate()
  const [questions, setQuestions]   = useState([])
  const [answers, setAnswers]       = useState({})
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft]     = useState(exam.durationMinutes * 60)
  const [submitted, setSubmitted]   = useState(false)
  const [result, setResult]         = useState(null)
  const [current, setCurrent]       = useState(0)
  const [tabWarning, setTabWarning] = useState(0)
  const [showTabAlert, setShowTabAlert] = useState(false)
  const [attemptId, setAttemptId]   = useState(null)  // lưu attemptId để heartbeat

  // Load câu hỏi + start/resume attempt
  useEffect(() => {
    const load = async () => {
      try {
        // 1. Gọi /start → backend trả về attempt IN_PROGRESS (tạo mới hoặc resume)
        const [examRes, startRes] = await Promise.all([
          api.get(`/exams/${exam.id}`, { params: { includeQuestions: true, hideCorrect: true } }),
          api.post(`/attempts/exams/${exam.id}/start`)
        ])
        setQuestions(examRes.data.data?.questions || [])

        const attempt = startRes.data.data
        setAttemptId(attempt.id)
        setTabWarning(attempt.tabViolationCount || 0)

        // Resume timer: nếu allowResume=true thì dùng timeRemainingSeconds từ server
        if (attempt.allowResume !== false && attempt.timeRemainingSeconds != null) {
          setTimeLeft(attempt.timeRemainingSeconds)
        }
        // Restore câu trả lời đã làm (nếu có)
        if (attempt.answers?.length) {
          const restored = {}
          attempt.answers.forEach(a => {
            if (a.selectedAnswerId) restored[a.questionId] = a.selectedAnswerId
            else if (a.textAnswer)  restored[a.questionId] = a.textAnswer
          })
          setAnswers(restored)
        }
      } catch (err) {
        const msg = err?.response?.data?.message || ''
        if (msg.includes('lần thi') || err?.response?.status === 400) {
          alert('Bạn đã hết số lần thi cho phép!')
          onClose()
        }
        setQuestions([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [exam.id])

  // Đếm ngược thời gian
  useEffect(() => {
    if (submitted || loading) return
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(t); handleSubmit(true); return 0 }
        return p - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [submitted, loading])

  // Dùng ref để heartbeat luôn đọc được giá trị mới nhất (tránh stale closure)
  const timeLeftRef  = useRef(timeLeft)
  const tabWarningRef = useRef(tabWarning)
  const attemptIdRef  = useRef(attemptId)
  useEffect(() => { timeLeftRef.current  = timeLeft   }, [timeLeft])
  useEffect(() => { tabWarningRef.current = tabWarning }, [tabWarning])
  useEffect(() => { attemptIdRef.current  = attemptId  }, [attemptId])

  // Ref lưu answers mới nhất để heartbeat gửi lên
  const answersRef = useRef(answers)
  useEffect(() => { answersRef.current = answers }, [answers])
  const submittingRef = useRef(false) // flag ngăn heartbeat chạy khi đang submit

  // Hàm lưu tiến trình — chỉ lưu timer + violations, KHÔNG lưu answers (tránh DB conflict)
  const saveProgress = useCallback((tabCount) => {
    if (!attemptIdRef.current) return
    const payload = {
      timeRemainingSeconds: timeLeftRef.current,
      tabViolationCount:    tabCount ?? tabWarningRef.current,
    }
    api.patch(`/attempts/${attemptIdRef.current}/heartbeat`, payload)
      .catch(e => console.error('[heartbeat] ERROR', e?.response?.status))
  }, [])

  // Heartbeat định kỳ mỗi 10 giây
  useEffect(() => {
    if (submitted || loading) return
    const hb = setInterval(() => { if (!submittingRef.current) saveProgress() }, 10000)
    return () => clearInterval(hb)
  }, [submitted, loading, saveProgress])

  // Anti-cheat: cảnh báo khi chuyển tab / minimize
  useEffect(() => {
    if (submitted || loading) return

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        setTabWarning(n => {
          const next = n + 1
          setShowTabAlert(true)
          // Lưu ngay khi thoát tab — dùng tabCount mới nhất
          saveProgress(next)
          return next
        })
      }
    }

    const handleBeforeUnload = (e) => {
      // Lưu ngay khi đóng tab/trình duyệt bằng sendBeacon (sync)
      if (attemptIdRef.current) {
        const answerList = Object.entries(answersRef.current).map(([qId, val]) => ({
          questionId: Number(qId),
          answerId:   typeof val === 'number' ? val : null,
          textAnswer: typeof val === 'string'  ? val : null,
        }))
        const payload = JSON.stringify({
          timeRemainingSeconds: timeLeftRef.current,
          tabViolationCount:    tabWarningRef.current,
          answers:              answerList
        })
        // sendBeacon đảm bảo gửi được dù tab đang đóng
        navigator.sendBeacon(
          `/api/attempts/${attemptIdRef.current}/heartbeat`,
          new Blob([payload], { type: 'application/json' })
        )
      }
      e.preventDefault()
      e.returnValue = 'Bạn đang trong bài thi! Thoát sẽ mất bài làm.'
      return e.returnValue
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [submitted, loading, saveProgress])

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const urgent = timeLeft < 300 // < 5 phút
  const MAX_WARNINGS = 3

  const handleAnswer = (questionId, value) => {
    setAnswers(p => ({ ...p, [questionId]: value }))
  }

  const handleSubmit = async (auto = false) => {
    if (!auto) {
      const totalQ = questions.length
      const answeredCount = Object.keys(answersRef.current).length
      const unanswered = totalQ - answeredCount

      if (unanswered > 0) {
        const ok = confirm(
          `Bạn còn ${unanswered}/${totalQ} câu chưa trả lời!\n\nBấm OK để nộp bài, Hủy để quay lại tiếp tục làm.`
        )
        if (!ok) return
      } else {
        if (!confirm('Bạn đã trả lời tất cả câu hỏi. Xác nhận nộp bài?')) return
      }
    }
    submittingRef.current = true  // ngăn heartbeat chạy song song
    setSubmitting(true)
    try {
      const answerList = Object.entries(answersRef.current).map(([qId, val]) => ({
        questionId: Number(qId),
        answerId:   typeof val === 'number' ? val : null,
        textAnswer: typeof val === 'string'  ? val : null,
      }))

      // Đợi 500ms để heartbeat đang chạy kịp hoàn thành trước khi submit
      await new Promise(r => setTimeout(r, 500))

      const res = await api.post(`/attempts/${attemptIdRef.current}/submit`, answerList)
      const data = res.data.data

      setResult({
        totalQuestions: data.totalQuestions || questions.length,
        answered:       Object.keys(answers).length,
        score:          data.score,
        totalScore:     data.totalScore,
        passed:         data.passed,
        status:         data.status,
        correctCount:   data.correctCount,
        submitted:      true,
      })
      setSubmitted(true)
    } catch (err) {
      const msg = err?.response?.data?.message || err.message
      if (msg?.includes('đã được nộp') || msg?.includes('already')) {
        // Bài đã nộp thành công trước đó (double submit) — coi như OK
        setSubmitted(true)
      } else if (msg?.includes('lần thi') || err?.response?.status === 400) {
        alert('Bạn đã hết số lần thi cho phép!')
      } else {
        alert('Có lỗi khi nộp bài: ' + msg)
      }
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const q = questions[current]
  const answered = Object.keys(answers).length

  if (loading) return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
    </div>
  )

  // Màn hình kết quả
  if (submitted && result) return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-xl w-full max-w-md p-8 text-center shadow-xl">
        <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto mb-4">
          <span className="text-success">{Icon.check}</span>
        </div>
        <h2 className="text-xl font-bold text-[var(--text-1)] mb-2">Nộp bài thành công!</h2>
        {result.score != null ? (
          <div className="mb-4">
            <p className={`text-4xl font-bold mb-1 ${result.passed ? 'text-success' : 'text-danger'}`}>
              {result.score}/{result.totalScore}
            </p>
            <p className={`text-sm font-medium ${result.passed ? 'text-success' : 'text-danger'}`}>
              {result.passed ? 'Đạt' : 'Chưa đạt'}
            </p>
          </div>
        ) : (
          <p className="text-[var(--text-2)] text-sm mb-4">
            Bài có câu tự luận — giáo viên sẽ chấm điểm sau
          </p>
        )}
        <div className="bg-[var(--bg-elevated)] rounded-xl p-4 mb-6 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-3)]">Đề thi</span>
            <span className="text-[var(--text-1)] font-medium">{exam.title}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-3)]">Lớp</span>
            <span className="text-[var(--text-1)]">{exam.courseName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-3)]">Đã trả lời</span>
            <span className="text-[var(--text-1)]">{result.answered}/{result.totalQuestions} câu</span>
          </div>
        </div>
        <p className="text-xs text-[var(--text-3)] mb-4">Giáo viên sẽ chấm điểm và công bố kết quả sau</p>
        <div className="flex gap-3">
          <button onClick={() => { onSubmitted(); onClose() }} className="btn-secondary flex-1">
            Đóng
          </button>
          <button onClick={() => { onSubmitted(); onClose(); navigate(`/student/exams/${exam.id}/leaderboard`) }}
            className="btn-primary flex-1">
            Xem leaderboard
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-page)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
        <div>
          <h2 className="font-semibold text-[var(--text-1)]">{exam.title}</h2>
          <p className="text-xs text-[var(--text-3)]">{exam.courseName} · {questions.length} câu hỏi</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Timer */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-lg border ${
            urgent ? 'bg-danger/10 border-danger/30 text-danger animate-pulse'
                   : 'bg-[var(--bg-elevated)] border-[var(--border-base)] text-[var(--text-1)]'
          }`}>
            {Icon.clock} {fmt(timeLeft)}
          </div>
          {/* Progress */}
          <div className="text-sm text-[var(--text-3)]">
            <span className="text-accent font-semibold">{answered}</span>/{questions.length} đã trả lời
          </div>
          <button onClick={() => { if (confirm('Thoát? Bài làm sẽ không được lưu.')) { saveProgress(); onClose() } }}
            className="btn-ghost p-2 text-[var(--text-3)] hover:text-danger">
            {Icon.x}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Question list sidebar */}
        <div className="w-56 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 overflow-y-auto shrink-0">
          <p className="text-xs text-[var(--text-3)] mb-2 font-medium uppercase tracking-wider">Câu hỏi</p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((q, i) => (
              <button key={q.questionId} onClick={() => setCurrent(i)}
                className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all ${
                  current === i
                    ? 'bg-accent text-white'
                    : answers[q.questionId] !== undefined
                    ? 'bg-success/20 border border-success/40 text-success'
                    : 'bg-[var(--bg-elevated)] border border-[var(--border-base)] text-[var(--text-3)] hover:border-accent/50'
                }`}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Main question area */}
        <div className="flex-1 overflow-y-auto p-8">
          {q ? (
            <div className="max-w-3xl mx-auto">
              {/* Question header */}
              <div className="flex items-center gap-3 mb-6">
                <span className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent font-bold font-mono text-sm shrink-0">
                  {current + 1}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    q.type === 'MULTIPLE_CHOICE' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                    : q.type === 'TRUE_FALSE'    ? 'bg-success/15 text-success border border-success/25'
                    : 'bg-orange-400/15 text-orange-400 border border-orange-400/25'
                  }`}>
                    {q.type === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm'
                     : q.type === 'TRUE_FALSE' ? 'Đúng/Sai'
                     : 'Tự luận'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    q.difficulty === 'EASY'   ? 'bg-success/10 text-success'
                    : q.difficulty === 'HARD' ? 'bg-danger/10 text-danger'
                    : 'bg-yellow-400/10 text-warning'
                  }`}>
                    {q.difficulty === 'EASY' ? 'Dễ' : q.difficulty === 'HARD' ? 'Khó' : 'TB'}
                  </span>
                </div>
              </div>

              {/* Question content */}
              <p className="text-[var(--text-1)] text-base leading-relaxed mb-6">{q.content}</p>

              {/* Answers */}
              {(q.type === 'MULTIPLE_CHOICE') && (
                <div className="space-y-3">
                  {(q.answers || []).map((a, ai) => {
                    const isSelected = answers[q.questionId] === a.id
                    return (
                      <button key={a.id} onClick={() => handleAnswer(q.questionId, a.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-accent bg-accent/10 text-[var(--text-1)]'
                            : 'border-[var(--border-base)] bg-[var(--bg-elevated)]/50 hover:border-[var(--border-strong)] text-[var(--text-2)]'
                        }`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                          isSelected ? 'bg-accent text-white' : 'bg-[var(--border-base)] text-[var(--text-3)]'
                        }`}>
                          {String.fromCharCode(65 + ai)}
                        </div>
                        <span className="text-sm">{a.content}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {q.type === 'TRUE_FALSE' && (
                <div className="flex gap-4">
                  {[{ id: 'true', label: 'Đúng' }, { id: 'false', label: 'Sai' }].map(opt => (
                    <button key={opt.id} onClick={() => handleAnswer(q.questionId, opt.id)}
                      className={`flex-1 py-4 rounded-xl border text-sm font-medium transition-all ${
                        answers[q.questionId] === opt.id
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-[var(--border-base)] bg-[var(--bg-elevated)]/50 hover:border-[var(--border-strong)] text-[var(--text-2)]'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'ESSAY' && (
                <textarea
                  className="input-field w-full resize-none text-sm"
                  rows={8}
                  placeholder="Nhập câu trả lời của bạn..."
                  value={answers[q.questionId] || ''}
                  onChange={e => handleAnswer(q.questionId, e.target.value)}
                />
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <button disabled={current === 0} onClick={() => setCurrent(p => p - 1)}
                  className="btn-secondary disabled:opacity-40">
                  ← Câu trước
                </button>
                {current < questions.length - 1 ? (
                  <button onClick={() => setCurrent(p => p + 1)} className="btn-primary">
                    Câu tiếp →
                  </button>
                ) : (
                  <button onClick={() => handleSubmit(false)} disabled={submitting}
                    className="btn-primary bg-success/80 hover:bg-success border-success/50">
                    {submitting ? 'Đang nộp...' : 'Nộp bài'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-[var(--text-3)]">Không có câu hỏi</div>
          )}
        </div>
      </div>

      {/* Tab switch warning modal */}
      {showTabAlert && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center"
            style={{ background: 'var(--bg-surface)', border: '2px solid #f59e0b' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(245,158,11,0.15)' }}>
              <svg className="w-7 h-7" fill="none" stroke="#f59e0b" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2" style={{ color: '#f59e0b' }}>
              Cảnh báo gian lận!
            </h3>
            <p className="text-sm mb-2" style={{ color: 'var(--text-1)' }}>
              Bạn đã rời khỏi trang thi.
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>
              Lần vi phạm: <b style={{ color: tabWarning >= MAX_WARNINGS ? '#dc2626' : '#f59e0b' }}>
                {tabWarning} / {MAX_WARNINGS}
              </b>
            </p>
            {tabWarning >= MAX_WARNINGS ? (
              <div>
                <p className="text-sm mb-4 font-medium" style={{ color: '#dc2626' }}>
                  Bạn đã vi phạm quá số lần cho phép. Bài thi sẽ được nộp ngay!
                </p>
                <button
                  onClick={() => { setShowTabAlert(false); handleSubmit(true) }}
                  className="w-full py-2 rounded-xl text-sm font-medium text-white"
                  style={{ background: '#dc2626' }}>
                  Nộp bài ngay
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>
                  Vi phạm thêm {MAX_WARNINGS - tabWarning} lần nữa sẽ bị nộp bài tự động.
                </p>
                <button
                  onClick={() => setShowTabAlert(false)}
                  className="w-full py-2 rounded-xl text-sm font-medium text-white"
                  style={{ background: 'var(--accent)' }}>
                  Tiếp tục làm bài
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer submit bar */}
      <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-3 flex items-center justify-between shrink-0">
        <p className="text-sm text-[var(--text-3)]">
          {urgent && <span className="text-danger font-medium mr-2">Sắp hết giờ!</span>}
          Đã trả lời <span className="text-accent font-semibold">{answered}/{questions.length}</span> câu
        </p>
        <button onClick={() => handleSubmit(false)} disabled={submitting}
          className="btn-primary">
          {submitting ? 'Đang nộp...' : 'Nộp bài thi'}
        </button>
      </div>
    </div>
  )
}

// ── Exam Card ─────────────────────────────────────────────
function StudentExamCard({ exam, onTake, onViewResult, onLeaderboard }) {
  const now = new Date()
  const start = exam.startTime ? new Date(exam.startTime) : null
  const end   = exam.endTime   ? new Date(exam.endTime)   : null

  const isOpen     = (!start || now >= start) && (!end || now <= end)
  const isEnded    = end && now > end
  const notYet     = start && now < start
  const myCount    = exam.myAttemptCount ?? 0
  const maxCount   = exam.maxAttempts ?? 1
  const limitHit   = myCount >= maxCount
  const canTake    = isOpen && !limitHit

  const fmtTime = (dt) => dt ? new Date(dt).toLocaleString('vi-VN', {
    day:'2-digit', month:'2-digit', year:'numeric',
    hour:'2-digit', minute:'2-digit'
  }) : null

  return (
    <div className={`card p-0 overflow-hidden border transition-all ${
      isOpen ? 'border-accent/30 hover:border-accent/60' : 'border-[var(--border-base)]'
    }`}>
      {/* Status bar */}
      <div className={`h-1 w-full ${
        isEnded ? 'bg-[var(--border-base)]' : isOpen ? 'bg-accent' : 'bg-yellow-400'
      }`}/>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <span className="text-xs text-[var(--text-3)] font-medium">{exam.courseName}</span>
            <h3 className="text-[var(--text-1)] font-semibold mt-0.5 truncate">{exam.title}</h3>
            {exam.description && (
              <p className="text-[var(--text-3)] text-xs mt-0.5 line-clamp-2">{exam.description}</p>
            )}
          </div>
          <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium border ${
            isEnded  ? 'bg-[var(--bg-elevated)] border-[var(--border-strong)] text-[var(--text-3)]'
            : isOpen ? 'bg-accent/15 border-accent/30 text-accent'
            : 'bg-yellow-400/15 border-yellow-400/30 text-warning'
          }`}>
            {isEnded ? 'Đã kết thúc' : isOpen ? 'Đang mở' : 'Chưa mở'}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 py-3 border-y border-[var(--border-subtle)] mb-3">
          <div className="text-center">
            <p className="text-[var(--text-1)] font-semibold text-sm">{exam.durationMinutes ?? exam.duration ?? '?'}</p>
            <p className="text-[var(--text-3)] text-xs">phút</p>
          </div>
          <div className="text-center">
            <p className="text-[var(--text-1)] font-semibold text-sm">{exam.questionCount ?? 0}</p>
            <p className="text-[var(--text-3)] text-xs">câu hỏi</p>
          </div>
          <div className="text-center">
            <p className="text-[var(--text-1)] font-semibold text-sm">{exam.maxAttempts ?? 1}</p>
            <p className="text-[var(--text-3)] text-xs">lần thi</p>
          </div>
        </div>

        {/* Time info */}
        {(start || end) && (
          <div className="text-xs text-[var(--text-3)] mb-3 space-y-1">
            {start && <p>Mở: {fmtTime(start)}</p>}
            {end   && <p>Đóng: {fmtTime(end)}</p>}
          </div>
        )}

        {/* Action */}
        {/* Attempt count badge */}
        {maxCount > 0 && (
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="text-[var(--text-3)]">Lần thi: <span className={`font-semibold ${limitHit ? 'text-danger' : 'text-accent'}`}>{myCount}/{maxCount}</span></span>
            {myCount > 0 && (
              <button onClick={() => onViewResult(exam)} className="text-accent hover:underline text-xs">Xem kết quả →</button>
            )}
          </div>
        )}
        <button
          onClick={() => canTake && onTake(exam)}
          disabled={!canTake}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
            canTake
              ? 'bg-accent text-white hover:bg-accent/90 cursor-pointer'
              : limitHit
              ? 'bg-danger/10 text-danger cursor-not-allowed border border-danger/30'
              : 'bg-[var(--bg-elevated)] text-[var(--text-3)] cursor-not-allowed border border-[var(--border-base)]'
          }`}>
          {Icon.play}
          {limitHit ? `Đã hết lượt thi (${myCount}/${maxCount})` : isEnded ? 'Đã kết thúc' : isOpen ? 'Vào làm bài' : 'Chưa đến giờ thi'}
        </button>
        <button
          onClick={() => onLeaderboard(exam)}
          className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium
            bg-[var(--bg-elevated)] text-[var(--text-2)] hover:text-accent hover:border-accent/40
            border border-[var(--border-base)] transition-all">
          Bảng xếp hạng
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────
export default function StudentExamsPage() {
  const navigate = useNavigate()
  const [exams, setExams]     = useState([])
  const [loading, setLoading] = useState(true)
  const [taking, setTaking]   = useState(null)
  const [viewingResult, setViewingResult] = useState(null)
  const [filter, setFilter]   = useState('all') // all | open | ended

  const load = () => {
    setLoading(true)
    api.get('/exams/student')
      .then(r => setExams(r.data.data || []))
      .catch(() => setExams([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const now = new Date()
  const filtered = exams.filter(e => {
    if (filter === 'open') {
      const s = e.startTime ? new Date(e.startTime) : null
      const end = e.endTime ? new Date(e.endTime) : null
      return (!s || now >= s) && (!end || now <= end)
    }
    if (filter === 'ended') return e.endTime && now > new Date(e.endTime)
    return true
  })

  const openCount  = exams.filter(e => {
    const s = e.startTime ? new Date(e.startTime) : null
    const end = e.endTime ? new Date(e.endTime) : null
    return (!s || now >= s) && (!end || now <= end)
  }).length

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Đề thi</h1>
        <p className="text-[var(--text-2)] text-sm mt-1">Danh sách đề thi dành cho bạn</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tổng đề thi', value: exams.length, color: 'text-accent' },
          { label: 'Đang mở',     value: openCount,    color: 'text-success' },
          { label: 'Đã kết thúc', value: exams.length - openCount, color: 'text-[var(--text-3)]' },
        ].map(s => (
          <div key={s.label} className="card text-center py-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[var(--text-3)] text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all',   label: 'Tất cả' },
          { key: 'open',  label: 'Đang mở' },
          { key: 'ended', label: 'Đã kết thúc' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f.key
                ? 'bg-accent text-white'
                : 'bg-[var(--bg-elevated)] text-[var(--text-3)] hover:text-[var(--text-1)] border border-[var(--border-base)]'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Exam grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          
          <p className="text-[var(--text-2)] font-medium">
            {exams.length === 0 ? 'Chưa có đề thi nào được giao' : 'Không có đề thi nào trong mục này'}
          </p>
          <p className="text-[var(--text-3)] text-sm mt-1">
            {exams.length === 0 ? 'Giáo viên sẽ giao đề thi khi có bài kiểm tra' : ''}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(e => (
            <StudentExamCard key={e.id} exam={e} onTake={setTaking} onViewResult={(ex) => { setViewingResult(ex); }}
              onLeaderboard={(ex) => navigate(`/student/exams/${ex.id}/leaderboard`)} />
          ))}
        </div>
      )}

      {/* Take exam modal */}
      {taking && (
        <TakeExamModal
          exam={taking}
          onClose={() => setTaking(null)}
          onSubmitted={() => { load(); setTaking(null) }}
        />
      )}
      {viewingResult && (
        <ResultHistoryModal exam={viewingResult} onClose={() => setViewingResult(null)} />
      )}
    </div>
  )
}
