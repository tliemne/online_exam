import { useState, useRef } from 'react'
import { questionApi } from '../../../api/services'

const TABS = [
  { key: 'excel', label: 'Excel', accept: '.xlsx' },
  { key: 'csv',   label: 'CSV',   accept: '.csv'  },
  { key: 'json',  label: 'JSON',  accept: '.json' },
]

const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
  </svg>
)

export default function ImportQuestionsModal({ courseId, onClose, onImported }) {
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
      <div className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl w-full max-w-2xl shadow-md max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-base)] shrink-0">
          <div>
            <h2 className="section-title">Import câu hỏi</h2>
            <p className="text-[var(--text-3)] text-xs mt-0.5">Hỗ trợ Excel · CSV · JSON</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><CloseIcon /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Tabs */}
          <div className="flex gap-2">
            {TABS.map(t => (
              <button key={t.key} onClick={() => handleTabChange(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  tab === t.key
                    ? 'bg-accent/10 border-accent/40 text-accent'
                    : 'bg-[var(--bg-elevated)] border-[var(--border-base)] text-[var(--text-3)] hover:text-[var(--text-1)]'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Format guide */}
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-base)] rounded-xl p-4 text-xs font-mono text-[var(--text-3)] space-y-1">
            {tab === 'excel' && (<>
              <p className="text-accent font-semibold mb-2">Cấu trúc file Excel (.xlsx):</p>
              <p><span className="text-[var(--text-2)]">Cột A:</span> content — nội dung câu hỏi</p>
              <p><span className="text-[var(--text-2)]">Cột B:</span> type — MULTIPLE_CHOICE | TRUE_FALSE | ESSAY</p>
              <p><span className="text-[var(--text-2)]">Cột C:</span> difficulty — EASY | MEDIUM | HARD</p>
              <p><span className="text-[var(--text-2)]">Cột D-G:</span> A, B, C, D — các đáp án (chỉ cần cho MC)</p>
              <p><span className="text-[var(--text-2)]">Cột H:</span> correct — A/B/C/D hoặc ĐÚNG/SAI</p>
              <p><span className="text-[var(--text-2)]">Cột I:</span> tags — tuỳ chọn, cách nhau bằng dấu phẩy (vd: Java,OOP)</p>
            </>)}
            {tab === 'csv' && (<>
              <p className="text-accent font-semibold mb-2">Cấu trúc file CSV:</p>
              <p>content,type,difficulty,A,B,C,D,correct,tags</p>
              <p className="text-[var(--text-3)] mt-1">"Java là gì?",MULTIPLE_CHOICE,EASY,"OOP","Script","Asm","FP",A,"Java|OOP"</p>
              <p className="text-[var(--text-3)]">* Cột tags dùng | để ngăn cách (tránh nhầm dấu phẩy CSV)</p>
            </>)}
            {tab === 'json' && (<>
              <p className="text-accent font-semibold mb-2">Cấu trúc JSON:</p>
              <p>{'[{ "content":"...", "type":"MULTIPLE_CHOICE",'}</p>
              <p>{'   "difficulty":"EASY", "tagNames":["Java","OOP"],'}</p>
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
                : 'border-[var(--border-strong)] hover:border-accent/40'
              }`}>
              <input ref={fileRef} type="file"
                accept={TABS.find(t => t.key === tab).accept}
                className="hidden"
                onChange={e => setFile(e.target.files[0])} />
              {file ? (
                <div>
                  <p className="text-[var(--text-1)] font-medium text-sm">{file.name}</p>
                  <p className="text-[var(--text-3)] text-xs mt-1">
                    {(file.size / 1024).toFixed(1)} KB ·
                    <button onClick={e => { e.stopPropagation(); setFile(null) }}
                      className="text-danger ml-2 hover:underline">Xóa</button>
                  </p>
                </div>
              ) : (
                <div>
                  <svg className="w-8 h-8 mx-auto mb-3 text-[var(--text-3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
                  </svg>
                  <p className="text-[var(--text-2)] text-sm">Kéo thả file vào đây hoặc click để chọn</p>
                  <p className="text-[var(--text-3)] text-xs mt-1">
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
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-base)] rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold font-mono">{result.totalRows}</div>
                  <div className="text-xs text-[var(--text-3)] mt-1">Tổng dòng</div>
                </div>
                <div className="bg-success/5 border border-success/25 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold font-mono text-success">{result.successCount}</div>
                  <div className="text-xs text-success/70 mt-1">Thành công</div>
                </div>
                <div className={`rounded-xl p-4 text-center border ${result.failCount > 0 ? 'bg-danger/5 border-danger/25' : 'bg-[var(--bg-elevated)] border-[var(--border-base)]'}`}>
                  <div className={`text-2xl font-bold font-mono ${result.failCount > 0 ? 'text-danger' : 'text-[var(--text-3)]'}`}>{result.failCount}</div>
                  <div className="text-xs text-[var(--text-3)] mt-1">Lỗi</div>
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
        <div className="flex gap-3 px-6 py-4 border-t border-[var(--border-base)] shrink-0">
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
                  : 'Import'}
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
