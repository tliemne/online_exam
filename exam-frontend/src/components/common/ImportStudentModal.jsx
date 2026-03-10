// src/components/common/ImportStudentModal.jsx
import { useState, useRef } from 'react'
import api from '../../api/client'

export default function ImportStudentModal({ courseId, courseName, onClose, onImported }) {
  const [file, setFile]         = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')
  const inputRef                = useRef()

  const handleFile = (f) => {
    if (!f) return
    if (!f.name.endsWith('.xlsx')) return setError('Chỉ hỗ trợ file Excel .xlsx')
    setFile(f)
    setError('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleImport = async () => {
    if (!file) return setError('Chọn file Excel trước')
    setLoading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const url = courseId
        ? `/users/students/import?courseId=${courseId}`
        : '/users/students/import'
      const r = await api.post(url, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(r.data.data)
      onImported?.()
    } catch (err) {
      setError(err?.response?.data?.message || 'Import thất bại, kiểm tra lại file')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-800 border border-surface-600 rounded-2xl w-full max-w-lg shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-700">
          <div>
            <h3 className="font-semibold text-text-primary">📊 Import sinh viên từ Excel</h3>
            {courseName && <p className="text-xs text-text-muted mt-0.5">Lớp: {courseName}</p>}
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 text-text-muted hover:text-text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {result ? (
            /* ── Kết quả ── */
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">{result.errorCount === 0 ? '✅' : '⚠️'}</div>
                <p className="text-text-primary font-semibold">Import hoàn tất</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Thành công', value: result.successCount, color: 'text-green-accent' },
                  { label: 'Lỗi',        value: result.errorCount,   color: 'text-red-accent' },
                  { label: 'Gửi email',  value: result.emailSentCount, color: 'text-accent' },
                ].map(s => (
                  <div key={s.label} className="bg-surface-700 rounded-xl p-3 text-center">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-text-muted text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {result.errors?.length > 0 && (
                <div className="bg-red-accent/5 border border-red-accent/20 rounded-xl p-3 max-h-32 overflow-y-auto">
                  <p className="text-xs text-red-accent font-medium mb-2">Chi tiết lỗi:</p>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-text-muted py-0.5">• {e}</p>
                  ))}
                </div>
              )}

              {result.emailSentCount > 0 && (
                <div className="bg-accent/5 border border-accent/20 rounded-lg px-3 py-2">
                  <p className="text-accent text-xs">✉ Đã gửi email thông tin đăng nhập đến {result.emailSentCount} sinh viên có email.</p>
                </div>
              )}

              <button onClick={onClose} className="btn-primary w-full">Đóng</button>
            </div>
          ) : (
            /* ── Upload form ── */
            <>
              {/* Template download */}
              <div className="flex items-center justify-between bg-surface-700 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">File mẫu Excel</p>
                  <p className="text-xs text-text-muted">Tải về và điền theo đúng format</p>
                </div>
                <a href="/template_import_sinhvien.xlsx" download
                  className="btn-ghost text-xs px-3 py-1.5 text-accent border border-accent/30 rounded-lg hover:bg-accent/10">
                  ⬇ Tải mẫu
                </a>
              </div>

              {/* Format guide */}
              <div className="bg-surface-700/50 rounded-xl p-3">
                <p className="text-xs text-text-muted font-medium mb-2 uppercase tracking-wider">Cột trong file Excel</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    ['A', 'Họ và tên *'],
                    ['B', 'Username'],
                    ['C', 'Mật khẩu'],
                    ['D', 'Email'],
                    ['E', 'Mã sinh viên'],
                    ['F', 'Lớp học'],
                  ].map(([col, label]) => (
                    <div key={col} className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-accent/20 text-accent text-xs font-mono font-bold flex items-center justify-center shrink-0">{col}</span>
                      <span className="text-xs text-text-muted">{label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-text-muted mt-2 opacity-70">* bắt buộc · B, C để trống = tự sinh · D dùng gửi email</p>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragging ? 'border-accent bg-accent/10' : 'border-surface-500 hover:border-accent/50 hover:bg-surface-700/30'
                }`}>
                <input ref={inputRef} type="file" accept=".xlsx" className="hidden"
                  onChange={e => handleFile(e.target.files[0])} />
                <div className="text-3xl mb-2">{file ? '📊' : '📁'}</div>
                {file ? (
                  <>
                    <p className="text-text-primary font-medium text-sm">{file.name}</p>
                    <p className="text-text-muted text-xs mt-1">{(file.size / 1024).toFixed(1)} KB · Click để đổi file</p>
                  </>
                ) : (
                  <>
                    <p className="text-text-secondary text-sm">Kéo thả file Excel vào đây</p>
                    <p className="text-text-muted text-xs mt-1">hoặc click để chọn file · chỉ hỗ trợ .xlsx</p>
                  </>
                )}
              </div>

              {error && (
                <div className="bg-red-accent/10 border border-red-accent/30 rounded-lg px-4 py-2.5">
                  <p className="text-red-accent text-sm">⚠ {error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={onClose} className="btn-secondary flex-1">Hủy</button>
                <button onClick={handleImport} disabled={!file || loading}
                  className="btn-primary flex-1">
                  {loading
                    ? <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                        Đang import...
                      </span>
                    : '⬆ Import sinh viên'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
