// src/components/common/ImportUserModal.jsx
// Admin import hàng loạt user (STUDENT + TEACHER) từ Excel
import { useState, useRef } from 'react'
import api from '../../api/client'

export default function ImportUserModal({ onClose, onImported }) {
  const [file, setFile]         = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')
  const inputRef                = useRef()

  const handleFile = (f) => {
    if (!f) return
    if (!f.name.endsWith('.xlsx')) return setError('Chỉ hỗ trợ file Excel .xlsx')
    setFile(f); setError('')
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleImport = async () => {
    if (!file) return setError('Chọn file Excel trước')
    setLoading(true); setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const r = await api.post('/users/import', form, {
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
      <div className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl w-full max-w-lg shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="font-semibold text-[var(--text-1)]">📊 Import người dùng từ Excel</h3>
            <p className="text-xs text-[var(--text-3)] mt-0.5">Admin — có thể import cả Student và Teacher</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 text-[var(--text-3)] hover:text-[var(--text-1)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {result ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">{result.errorCount === 0 ? '✅' : '⚠️'}</div>
                <p className="text-[var(--text-1)] font-semibold">Import hoàn tất</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Thành công', value: result.successCount, color: 'text-green-accent' },
                  { label: 'Lỗi',        value: result.errorCount,   color: 'text-red-accent'   },
                  { label: 'Gửi email',  value: result.emailSentCount, color: 'text-accent'      },
                ].map(s => (
                  <div key={s.label} className="bg-[var(--bg-elevated)] rounded-xl p-3 text-center">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[var(--text-3)] text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {result.errors?.length > 0 && (
                <div className="bg-red-accent/5 border border-red-accent/20 rounded-xl p-3 max-h-32 overflow-y-auto">
                  <p className="text-xs text-red-accent font-medium mb-2">Chi tiết lỗi:</p>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-[var(--text-3)] py-0.5">• {e}</p>
                  ))}
                </div>
              )}

              {result.created?.length > 0 && (
                <div className="bg-[var(--bg-elevated)] rounded-xl p-3 max-h-40 overflow-y-auto">
                  <p className="text-xs text-[var(--text-3)] font-medium mb-2 uppercase tracking-wider">Đã tạo ({result.created.length})</p>
                  {result.created.map((u, i) => (
                    <div key={i} className="flex justify-between items-center py-1 border-b border-[var(--border-base)] last:border-0">
                      <span className="text-sm text-[var(--text-1)]">{u.fullName}</span>
                      <span className="text-xs font-mono text-accent">{u.username}</span>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={onClose} className="btn-primary w-full">Đóng</button>
            </div>
          ) : (
            <>
              {/* Template download */}
              <div className="flex items-center justify-between bg-[var(--bg-elevated)] rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text-1)]">File mẫu Excel (Admin)</p>
                  <p className="text-xs text-[var(--text-3)]">Có 2 sheet: hỗn hợp Student+Teacher và chỉ Student</p>
                </div>
                <a href="/template_import_users.xlsx" download
                  className="btn-ghost text-xs px-3 py-1.5 text-accent border border-accent/30 rounded-lg hover:bg-accent/10">
                  ⬇ Tải mẫu
                </a>
              </div>

              {/* Column guide */}
              <div className="bg-[var(--bg-elevated)]/50 rounded-xl p-3">
                <p className="text-xs text-[var(--text-3)] font-medium mb-2 uppercase tracking-wider">Cột trong file Excel</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    ['A', 'Họ và tên *'],
                    ['B', 'Username'],
                    ['C', 'Mật khẩu'],
                    ['D', 'Email'],
                    ['E', 'Role (STUDENT/TEACHER)'],
                    ['F', 'Mã SV / Mã GV'],
                    ['G', 'Lớp / Khoa'],
                  ].map(([col, label]) => (
                    <div key={col} className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-accent/20 text-accent text-xs font-mono font-bold flex items-center justify-center shrink-0">{col}</span>
                      <span className="text-xs text-[var(--text-3)]">{label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[var(--text-3)] mt-2 opacity-70">
                  * bắt buộc · B,C để trống = tự sinh · E để trống = STUDENT
                </p>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragging ? 'border-accent bg-accent/10' : 'border-[var(--border-strong)] hover:border-accent/50 hover:bg-[var(--bg-elevated)]/30'
                }`}>
                <input ref={inputRef} type="file" accept=".xlsx" className="hidden"
                  onChange={e => handleFile(e.target.files[0])} />
                <div className="text-3xl mb-2">{file ? '📊' : '📁'}</div>
                {file ? (
                  <>
                    <p className="text-[var(--text-1)] font-medium text-sm">{file.name}</p>
                    <p className="text-[var(--text-3)] text-xs mt-1">{(file.size/1024).toFixed(1)} KB · Click để đổi file</p>
                  </>
                ) : (
                  <>
                    <p className="text-[var(--text-2)] text-sm">Kéo thả file Excel vào đây</p>
                    <p className="text-[var(--text-3)] text-xs mt-1">hoặc click để chọn · chỉ .xlsx</p>
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
                <button onClick={handleImport} disabled={!file || loading} className="btn-primary flex-1">
                  {loading
                    ? <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                        Đang import...
                      </span>
                    : '⬆ Import người dùng'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
