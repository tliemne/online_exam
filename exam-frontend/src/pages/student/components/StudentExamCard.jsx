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

export default function StudentExamCard({ exam, onTake, onViewResult, onLeaderboard }) {
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
