import { useState, useEffect, useCallback, useRef } from 'react'
import { questionApi, courseApi } from '../../api/services'
import Pagination from '../../components/common/Pagination'
import { useAuth } from '../../context/AuthContext'

// ══════════════════════════════════════════════════════════
// IMPORT QUESTIONS MODAL
// ══════════════════════════════════════════════════════════

const TABS = [
  { key: 'excel', label: 'Excel', accept: '.xlsx' },
  { key: 'csv',   label: '📄 CSV',   accept: '.csv'  },
  { key: 'json',  label: 'JSON',  accept: '.json' },
]

function ImportQuestionsModal({ courseId, onClose, onImported }) {
  const [tab, setTab] = useState('excel')
  const [file, setFile] = useState(null)
  const [jsonText, setJsonText] = useState('')
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const reset = () => { setFile(null); setJsonText(''); setResult(null); setError('') }
  const handleTabChange = (t) => { setTab(t); reset() }

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const handleImport = async () => {
    setLoading(true); setError(''); setResult(null)
    try {
      let res
      if (tab === 'excel') {
        if (!file) { setError('Chưa chọn file'); setLoading(false); return }
        res = await questionApi.importExcel(file, courseId)
      } else if (tab === 'csv') {
        if (!file) { setError('Chưa chọn file'); setLoading(false); return }
        res = await questionApi.importCsv(file, courseId)
      } else {
        if (!jsonText.trim()) { setError('Chưa nhập JSON'); setLoading(false); return }
        let parsed
        try { parsed = JSON.parse(jsonText) }
        catch { setError('JSON không hợp lệ'); setLoading(false); return }
        if (!Array.isArray(parsed)) { setError('JSON phải là array [...]'); setLoading(false); return }
        res = await questionApi.importJson(parsed, courseId)
      }
      setResult(res.data.data)
      if (res.data.data.successCount > 0) onImported()
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi import')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-800 border border-surface-600 rounded-2xl w-full max-w-2xl shadow-md max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-600 shrink-0">
          <div>
            <h2 className="section-title">Import câu hỏi</h2>
            <p className="text-text-muted text-xs mt-0.5">Hỗ trợ Excel · CSV · JSON</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Tabs */}
          <div className="flex gap-2">
            {TABS.map(t => (
              <button key={t.key} onClick={() => handleTabChange(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  tab === t.key
                    ? 'bg-accent/10 border-accent/40 text-accent'
                    : 'bg-surface-700 border-surface-600 text-text-muted hover:text-text-primary'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Format guide */}
          <div className="bg-surface-700 border border-surface-600 rounded-xl p-4 text-xs font-mono text-text-muted space-y-1">
            {tab === 'excel' && (<>
              <p className="text-accent font-semibold mb-2">Cấu trúc file Excel (.xlsx):</p>
              <p><span className="text-text-secondary">Cột A:</span> content — nội dung câu hỏi</p>
              <p><span className="text-text-secondary">Cột B:</span> type — MULTIPLE_CHOICE | TRUE_FALSE | ESSAY</p>
              <p><span className="text-text-secondary">Cột C:</span> difficulty — EASY | MEDIUM | HARD</p>
              <p><span className="text-text-secondary">Cột D-G:</span> A, B, C, D — các đáp án (chỉ cần cho MC)</p>
              <p><span className="text-text-secondary">Cột H:</span> correct — A/B/C/D hoặc ĐÚNG/SAI</p>
            </>)}
            {tab === 'csv' && (<>
              <p className="text-accent font-semibold mb-2">Cấu trúc file CSV:</p>
              <p>content,type,difficulty,A,B,C,D,correct</p>
              <p className="text-text-muted mt-1">"Java là gì?",MULTIPLE_CHOICE,EASY,"OOP","Script","Asm","FP",A</p>
            </>)}
            {tab === 'json' && (<>
              <p className="text-accent font-semibold mb-2">Cấu trúc JSON:</p>
              <p>{'[{ "content":"...", "type":"MULTIPLE_CHOICE",'}</p>
              <p>{'   "difficulty":"EASY",'}</p>
              <p>{'   "answers":[{"content":"A","correct":true},...] }]'}</p>
            </>)}
          </div>

          {/* Upload zone / JSON textarea */}
          {tab !== 'json' ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragging ? 'border-accent bg-accent/5'
                : file ? 'border-success/40 bg-success/5'
                : 'border-surface-500 hover:border-accent/40'
              }`}>
              <input ref={fileRef} type="file"
                accept={TABS.find(t => t.key === tab).accept}
                className="hidden"
                onChange={e => setFile(e.target.files[0])} />
              {file ? (
                <div>
                  
                  <p className="text-text-primary font-medium text-sm">{file.name}</p>
                  <p className="text-text-muted text-xs mt-1">
                    {(file.size / 1024).toFixed(1)} KB ·
                    <button onClick={e => { e.stopPropagation(); setFile(null) }}
                      className="text-danger ml-2 hover:underline">Xóa</button>
                  </p>
                </div>
              ) : (
                <div>
                  <svg className="w-8 h-8 mx-auto mb-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
                  </svg>
                  <p className="text-text-secondary text-sm">Kéo thả file vào đây hoặc click để chọn</p>
                  <p className="text-text-muted text-xs mt-1">
                    {tab === 'excel' ? '.xlsx' : '.csv'} · Tối đa 5MB
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="label text-xs mb-2">Dán JSON vào đây</label>
              <textarea
                className="input-field resize-none font-mono text-xs"
                rows={8}
                placeholder={'[\n  {\n    "content": "Câu hỏi...",\n    "type": "MULTIPLE_CHOICE",\n    "difficulty": "EASY",\n    "answers": [\n      {"content": "A", "correct": true},\n      {"content": "B", "correct": false}\n    ]\n  }\n]'}
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-surface-700 border border-surface-600 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold font-mono">{result.totalRows}</div>
                  <div className="text-xs text-text-muted mt-1">Tổng dòng</div>
                </div>
                <div className="bg-success/5 border border-success/25 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold font-mono text-success">{result.successCount}</div>
                  <div className="text-xs text-success/70 mt-1">Thành công</div>
                </div>
                <div className={`rounded-xl p-4 text-center border ${result.failCount > 0 ? 'bg-danger/5 border-danger/25' : 'bg-surface-700 border-surface-600'}`}>
                  <div className={`text-2xl font-bold font-mono ${result.failCount > 0 ? 'text-danger' : 'text-text-muted'}`}>{result.failCount}</div>
                  <div className="text-xs text-text-muted mt-1">Lỗi</div>
                </div>
              </div>
              {result.errors?.length > 0 && (
                <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 max-h-36 overflow-y-auto">
                  <p className="text-xs font-semibold text-danger mb-2">Chi tiết lỗi</p>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-danger/80 font-mono py-0.5">{e}</p>
                  ))}
                </div>
              )}
              {result.successCount > 0 && (
                <div className="flex items-center gap-2 text-success text-sm">
                  Đã thêm {result.successCount} câu hỏi thành công!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-surface-600 shrink-0">
          {!result ? (
            <>
              <button onClick={handleImport}
                disabled={loading || (tab !== 'json' && !file) || (tab === 'json' && !jsonText.trim())}
                className="btn-primary flex-1">
                {loading
                  ? <span className="flex items-center gap-2 justify-center">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                      Đang import...
                    </span>
                  : '📥 Import'}
              </button>
              <button onClick={onClose} className="btn-secondary">Hủy</button>
            </>
          ) : (
            <>
              <button onClick={reset} className="btn-secondary flex-1">Import thêm</button>
              <button onClick={onClose} className="btn-primary flex-1">Xong</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// QUESTIONS PAGE
// ══════════════════════════════════════════════════════════

const Icon = {
  plus: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>,
  edit: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>,
  trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>,
  x: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  search: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  eye: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5"/></svg>,
  refresh: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>,
  upload: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>,
}

const TYPE_LABELS = { MULTIPLE_CHOICE: 'Trắc nghiệm', TRUE_FALSE: 'Đúng / Sai', ESSAY: 'Tự luận' }
const TYPE_COLORS = { MULTIPLE_CHOICE: 'badge-blue', TRUE_FALSE: 'badge-cyan', ESSAY: 'badge-neutral' }
const DIFF_LABELS = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' }
const DIFF_COLORS = { EASY: 'badge-green', MEDIUM: 'badge-amber', HARD: 'badge-red' }

function Modal({ title, onClose, children, maxWidth = 'max-w-2xl' }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-surface-800 border border-surface-600 rounded-2xl w-full ${maxWidth} shadow-md max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-600 shrink-0">
          <h2 className="section-title">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">{Icon.x}</button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

function AnswerRow({ answer, index, onChange, onRemove, canRemove }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
      answer.correct ? 'border-success/40 bg-success/5' : 'border-surface-600 bg-surface-700'
    }`}>
      <button type="button"
        onClick={() => onChange(index, 'correct', !answer.correct)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          answer.correct ? 'bg-success border-success text-white' : 'border-surface-400 hover:border-success'
        }`}>
        {answer.correct && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
      </button>
      <input className="input-field flex-1 py-1.5 text-sm"
        placeholder={`Đáp án ${String.fromCharCode(65 + index)}`}
        value={answer.content}
        onChange={e => onChange(index, 'content', e.target.value)} />
      {canRemove && (
        <button type="button" onClick={() => onRemove(index)} className="btn-ghost p-1 text-text-muted hover:text-danger shrink-0">
          {Icon.x}
        </button>
      )}
    </div>
  )
}

function QuestionFormModal({ question, courses, onClose, onSaved }) {
  const defaultAnswers = [
    { content: '', correct: false }, { content: '', correct: false },
    { content: '', correct: false }, { content: '', correct: false },
  ]
  const [form, setForm] = useState({
    content: question?.content || '',
    type: question?.type || 'MULTIPLE_CHOICE',
    difficulty: question?.difficulty || 'MEDIUM',
    courseId: question?.courseId || (courses[0]?.id || ''),
    answers: question?.answers?.map(a => ({ content: a.content, correct: a.correct })) || defaultAnswers,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleTypeChange = (type) => {
    let answers = []
    if (type === 'MULTIPLE_CHOICE') answers = defaultAnswers
    else if (type === 'TRUE_FALSE') answers = [{ content: 'Đúng', correct: true }, { content: 'Sai', correct: false }]
    setForm(f => ({ ...f, type, answers }))
  }

  const handleAnswerChange = (index, field, value) => {
    setForm(f => {
      const answers = [...f.answers]
      if (field === 'correct' && value && f.type === 'MULTIPLE_CHOICE') {
        answers.forEach((_, i) => { answers[i] = { ...answers[i], correct: i === index } })
      } else {
        answers[index] = { ...answers[index], [field]: value }
      }
      return { ...f, answers }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    if (form.type !== 'ESSAY' && !form.answers.some(a => a.correct)) { setError('Cần chọn ít nhất 1 đáp án đúng'); return }
    if (form.type !== 'ESSAY' && form.answers.some(a => !a.content.trim())) { setError('Vui lòng điền đầy đủ nội dung các đáp án'); return }
    setSaving(true)
    try {
      const payload = { content: form.content, type: form.type, difficulty: form.difficulty, courseId: Number(form.courseId), answers: form.type === 'ESSAY' ? [] : form.answers }
      if (question) await questionApi.update(question.id, payload)
      else await questionApi.create(payload)
      onSaved(); onClose()
    } catch (err) { setError(err.response?.data?.message || 'Có lỗi xảy ra') }
    finally { setSaving(false) }
  }

  return (
    <Modal title={question ? 'Sửa câu hỏi' : 'Tạo câu hỏi mới'} onClose={onClose}>
      {error && <div className="mb-4 px-3 py-2 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="input-label">Lớp học *</label>
          <select className="input-field" value={form.courseId} onChange={e => setForm({...form, courseId: e.target.value})} required>
            <option value="">-- Chọn lớp --</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Loại câu hỏi *</label>
            <select className="input-field" value={form.type} onChange={e => handleTypeChange(e.target.value)}>
              <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
              <option value="TRUE_FALSE">Đúng / Sai</option>
              <option value="ESSAY">Tự luận</option>
            </select>
          </div>
          <div>
            <label className="input-label">Độ khó</label>
            <select className="input-field" value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})}>
              <option value="EASY">Dễ</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HARD">Khó</option>
            </select>
          </div>
        </div>
        <div>
          <label className="input-label">Nội dung câu hỏi *</label>
          <textarea className="input-field resize-none" rows={3} placeholder="Nhập nội dung câu hỏi..."
            value={form.content} onChange={e => setForm({...form, content: e.target.value})} required />
        </div>
        {form.type !== 'ESSAY' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">Đáp án
                <span className="text-text-muted font-normal ml-2 normal-case tracking-normal">
                  {form.type === 'MULTIPLE_CHOICE' ? '(click vòng tròn để chọn đáp án đúng)' : ''}
                </span>
              </label>
              {form.type === 'MULTIPLE_CHOICE' && form.answers.length < 6 && (
                <button type="button" onClick={() => setForm(f => ({...f, answers: [...f.answers, {content:'',correct:false}]}))}
                  className="text-accent text-xs hover:underline flex items-center gap-1">
                  {Icon.plus} Thêm đáp án
                </button>
              )}
            </div>
            <div className="space-y-2">
              {form.answers.map((a, i) => (
                <AnswerRow key={i} answer={a} index={i}
                  onChange={handleAnswerChange}
                  onRemove={(idx) => setForm(f => ({...f, answers: f.answers.filter((_,j) => j !== idx)}))}
                  canRemove={form.type === 'MULTIPLE_CHOICE' && form.answers.length > 2} />
              ))}
            </div>
          </div>
        )}
        {form.type === 'ESSAY' && (
          <div className="px-4 py-3 rounded-lg bg-surface-700 border border-surface-600 text-text-muted text-sm">
            Câu tự luận — sinh viên sẽ nhập câu trả lời khi làm bài. Giáo viên chấm điểm thủ công.
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Đang lưu...' : question ? 'Lưu thay đổi' : 'Tạo câu hỏi'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
        </div>
      </form>
    </Modal>
  )
}

function PreviewModal({ question, onClose }) {
  return (
    <Modal title="Xem câu hỏi" onClose={onClose} maxWidth="max-w-lg">
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <span className={TYPE_COLORS[question.type]}>{TYPE_LABELS[question.type]}</span>
          <span className={DIFF_COLORS[question.difficulty]}>{DIFF_LABELS[question.difficulty]}</span>
          <span className="badge-neutral text-xs">{question.courseName}</span>
        </div>
        <p className="text-text-primary leading-relaxed">{question.content}</p>
        {question.type !== 'ESSAY' && question.answers?.length > 0 && (
          <div className="space-y-2">
            {question.answers.map((a, i) => (
              <div key={a.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
                a.correct ? 'border-success/40 bg-success/5 text-success' : 'border-surface-600 bg-surface-700 text-text-secondary'
              }`}>
                <span className="text-xs font-mono font-bold w-5 shrink-0">{String.fromCharCode(65+i)}.</span>
                <span className="text-sm flex-1">{a.content}</span>
                {a.correct && Icon.check}
              </div>
            ))}
          </div>
        )}
        {question.type === 'ESSAY' && (
          <div className="p-4 rounded-lg bg-surface-700 border border-surface-600 text-text-muted text-sm italic">
            [Sinh viên nhập câu trả lời tại đây]
          </div>
        )}
        <div className="pt-2 border-t border-surface-600 text-xs text-text-muted">
          Tạo bởi: {question.createdByName || '—'}
        </div>
      </div>
    </Modal>
  )
}

export default function QuestionsPage() {
  const { hasRole } = useAuth()
  const isTeacherOrAdmin = hasRole('TEACHER') || hasRole('ADMIN')

  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [showImport, setShowImport] = useState(false)

  const [filterType, setFilterType] = useState('')
  const [filterDiff, setFilterDiff] = useState('')
  const [keyword, setKeyword] = useState('')

  // Pagination
  const [page, setPage]           = useState(0)
  const [pageSize]                = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  useEffect(() => {
    courseApi.getAll().then(r => {
      const list = r.data.data || []
      setCourses(list)
      if (list.length > 0) setSelectedCourse(list[0].id)
    })
  }, [])

  const loadQuestions = useCallback(() => {
    if (!selectedCourse) return
    setLoading(true)
    questionApi.getAll(selectedCourse, {
      type: filterType || undefined,
      difficulty: filterDiff || undefined,
      keyword: keyword || undefined,
      paged: true,
      page,
      size: pageSize,
    }).then(r => {
      const data = r.data.data
      // Spring Page object: { content, totalPages, totalElements, number, size }
      if (data && data.content) {
        setQuestions(data.content)
        setTotalPages(data.totalPages)
        setTotalElements(data.totalElements)
      } else {
        setQuestions(data || [])
      }
    }).finally(() => setLoading(false))
  }, [selectedCourse, filterType, filterDiff, keyword, page, pageSize])

  // Reset về trang 0 khi đổi filter
  useEffect(() => { setPage(0) }, [selectedCourse, filterType, filterDiff, keyword])
  useEffect(() => { loadQuestions() }, [loadQuestions])

  const handleDelete = async (q) => {
    if (!confirm('Xóa câu hỏi này?')) return
    setDeleting(q.id)
    try {
      await questionApi.delete(q.id)
      loadQuestions()
    } finally { setDeleting(null) }
  }

  const counts = {
    MULTIPLE_CHOICE: questions.filter(q => q.type === 'MULTIPLE_CHOICE').length,
    TRUE_FALSE: questions.filter(q => q.type === 'TRUE_FALSE').length,
    ESSAY: questions.filter(q => q.type === 'ESSAY').length,
    EASY: questions.filter(q => q.difficulty === 'EASY').length,
    MEDIUM: questions.filter(q => q.difficulty === 'MEDIUM').length,
    HARD: questions.filter(q => q.difficulty === 'HARD').length,
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Ngân hàng câu hỏi</h1>
          <p className="text-text-secondary text-sm mt-1">{totalElements || questions.length} câu hỏi</p>
        </div>
        {isTeacherOrAdmin && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowImport(true)} className="btn-secondary flex items-center gap-2">
              {Icon.upload} Import file
            </button>
            <button onClick={() => { setSelected(null); setModal('create') }} className="btn-primary flex items-center gap-2">
              {Icon.plus} Tạo câu hỏi
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="label text-xs">Lớp học</label>
            <select className="input-field" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-48">
            <label className="label text-xs">Loại câu hỏi</label>
            <select className="input-field" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">Tất cả loại</option>
              <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
              <option value="TRUE_FALSE">Đúng / Sai</option>
              <option value="ESSAY">Tự luận</option>
            </select>
          </div>
          <div className="flex-1 min-w-36">
            <label className="label text-xs">Độ khó</label>
            <select className="input-field" value={filterDiff} onChange={e => setFilterDiff(e.target.value)}>
              <option value="">Tất cả</option>
              <option value="EASY">Dễ</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HARD">Khó</option>
            </select>
          </div>
          <div className="flex-1 min-w-48">
            <label className="label text-xs">Tìm kiếm</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{Icon.search}</span>
              <input className="input-field pl-9" placeholder="Nội dung câu hỏi..."
                value={keyword} onChange={e => setKeyword(e.target.value)} />
            </div>
          </div>
          <div className="pt-5">
            <button onClick={loadQuestions} className="btn-secondary">{Icon.refresh}</button>
          </div>
        </div>

        {questions.length > 0 && (
          <div className="flex gap-3 flex-wrap pt-1 border-t border-surface-600">
            <span className="text-xs text-text-muted">Phân bố:</span>
            {Object.entries(TYPE_LABELS).map(([k, v]) => counts[k] > 0 && (
              <span key={k} className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[k]}`}>{v}: {counts[k]}</span>
            ))}
            <span className="text-text-muted text-xs">|</span>
            {Object.entries(DIFF_LABELS).map(([k, v]) => counts[k] > 0 && (
              <span key={k} className={`text-xs px-2 py-0.5 rounded-full ${DIFF_COLORS[k]}`}>{v}: {counts[k]}</span>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
        </div>
      ) : questions.length === 0 ? (
        <div className="card text-center py-16">
          
          <p className="text-text-secondary">Chưa có câu hỏi nào. {isTeacherOrAdmin && 'Hãy tạo hoặc import câu hỏi!'}</p>
          {isTeacherOrAdmin && (
            <div className="flex gap-3 justify-center mt-4">
              <button onClick={() => setShowImport(true)} className="btn-secondary">{Icon.upload} Import file</button>
              <button onClick={() => { setSelected(null); setModal('create') }} className="btn-primary">{Icon.plus} Tạo câu hỏi</button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, index) => (
            <div key={q.id} className="card hover:border-accent/20 transition-all">
              <div className="flex items-start gap-4">
                <span className="text-text-muted text-sm font-mono shrink-0 mt-0.5 w-6">{index + 1}.</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-xs ${TYPE_COLORS[q.type]}`}>{TYPE_LABELS[q.type]}</span>
                    <span className={`text-xs ${DIFF_COLORS[q.difficulty]}`}>{DIFF_LABELS[q.difficulty]}</span>
                  </div>
                  <p className="text-text-primary text-sm leading-relaxed line-clamp-2">{q.content}</p>
                  {q.type !== 'ESSAY' && q.answers?.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {q.answers.map((a, i) => (
                        <span key={a.id} className={`text-xs px-2 py-0.5 rounded border ${
                          a.correct ? 'border-success/40 bg-success/10 text-success' : 'border-surface-600 text-text-muted'
                        }`}>
                          {String.fromCharCode(65+i)}. {a.content.length > 20 ? a.content.slice(0,20)+'…' : a.content}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {isTeacherOrAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => { setSelected(q); setModal('preview') }} className="btn-ghost p-1.5 text-text-muted hover:text-accent">{Icon.eye}</button>
                    <button onClick={() => { setSelected(q); setModal('edit') }} className="btn-ghost p-1.5 text-text-muted hover:text-accent">{Icon.edit}</button>
                    <button onClick={() => handleDelete(q)} disabled={deleting === q.id}
                      className="btn-ghost p-1.5 text-text-muted hover:text-danger hover:bg-danger/10">
                      {deleting === q.id
                        ? <span className="w-4 h-4 border border-danger border-t-transparent rounded-full animate-spin block"/>
                        : Icon.trash}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          size={pageSize}
          onPageChange={setPage}
        />
      )}

      {/* Modals */}
      {(modal === 'create' || modal === 'edit') && (
        <QuestionFormModal question={modal === 'edit' ? selected : null} courses={courses}
          onClose={() => setModal(null)} onSaved={loadQuestions} />
      )}
      {modal === 'preview' && selected && (
        <PreviewModal question={selected} onClose={() => setModal(null)} />
      )}
      {showImport && selectedCourse && (
        <ImportQuestionsModal courseId={selectedCourse}
          onClose={() => setShowImport(false)} onImported={loadQuestions} />
      )}
    </div>
  )
}
