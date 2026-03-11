import { useState, useEffect, useRef } from 'react'
import { userApi } from '../../api/services'
import api from '../../api/client'
import ResetPasswordModal from '../../components/common/ResetPasswordModal'
import Pagination from '../../components/common/Pagination'

const ROLE_TABS = [
  { key: 'ALL',     label: 'Tất cả' },
  { key: 'ADMIN',   label: 'Admin',      badgeClass: 'badge-red' },
  { key: 'TEACHER', label: 'Giảng viên', badgeClass: 'badge-cyan' },
  { key: 'STUDENT', label: 'Sinh viên',  badgeClass: 'badge-green' },
]

const emptyForm = {
  username: '', password: '', email: '', fullName: '', role: 'TEACHER',
  phone: '',  // Mã SV/GV sẽ được tự động tạo
}

// ── Tab Import Excel (Admin) ──────────────────────────────
function TabImportAdmin({ onClose, onImported }) {
  const [file, setFile]         = useRef ? useState(null) : useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')
  const inputRef                = useRef()

  const handleFile = (f) => { if (!f) return; if (!f.name.endsWith('.xlsx')) return setError('Chỉ hỗ trợ .xlsx'); setFile(f); setError('') }
  const handleImport = async () => {
    if (!file) return setError('Chọn file Excel trước')
    setLoading(true); setError('')
    try {
      const fd = new FormData(); fd.append('file', file)
      const r = await api.post('/users/import', fd, { headers: {'Content-Type':'multipart/form-data'} })
      setResult(r.data.data); onImported?.()
    } catch (err) { setError(err?.response?.data?.message||'Import thất bại') } finally { setLoading(false) }
  }

  if (result) return (
    <div className="p-7 space-y-5">
      <div className="text-center"><p className="font-semibold text-[var(--text-1)]">Import hoàn tất</p></div>
      <div className="grid grid-cols-3 gap-3">
        {[{label:'Thành công',value:result.successCount,color:'text-success'},{label:'Lỗi',value:result.errorCount,color:'text-danger'},{label:'Gửi email',value:result.emailSentCount,color:'text-accent'}].map(s=>(
          <div key={s.label} className="bg-[var(--bg-elevated)] rounded-xl p-3 text-center"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-[var(--text-3)] text-xs mt-0.5">{s.label}</p></div>
        ))}
      </div>
      {result.errors?.length>0 && <div className="bg-danger/8 border border-danger/20 rounded-xl p-3 max-h-32 overflow-y-auto"><p className="text-xs text-danger font-medium mb-2">Chi tiết lỗi:</p>{result.errors.map((e,i)=><p key={i} className="text-xs text-[var(--text-3)]">• {e}</p>)}</div>}
      {result.created?.length>0 && <div className="bg-[var(--bg-elevated)] rounded-xl p-3 max-h-36 overflow-y-auto"><p className="text-xs text-[var(--text-3)] font-medium mb-2 uppercase">Đã tạo ({result.created.length})</p>{result.created.map((u,i)=><div key={i} className="flex justify-between py-1 border-b border-[var(--border-base)] last:border-0"><span className="text-sm text-[var(--text-1)]">{u.fullName}</span><span className="text-xs font-mono text-accent">{u.username}</span></div>)}</div>}
      <button onClick={onClose} className="btn-primary w-full">Đóng</button>
    </div>
  )

  return (
    <div className="p-7 space-y-5">
      <div className="flex items-center justify-between bg-[var(--bg-elevated)] rounded-xl px-4 py-3">
        <div><p className="text-sm font-medium text-[var(--text-1)]">File mẫu Excel (Admin)</p><p className="text-xs text-[var(--text-3)]">Hỗ trợ cả Student và Teacher</p></div>
        <a href="/template_import_users.xlsx" download className="btn-ghost text-xs px-3 py-1.5 text-accent border border-accent/30 rounded-lg hover:bg-accent/10">Tải mẫu</a>
      </div>
      <div className="bg-[var(--bg-elevated)]/50 rounded-xl p-3">
        <p className="text-xs text-[var(--text-3)] font-medium mb-2 uppercase tracking-wider">Cột trong file Excel</p>
        <div className="grid grid-cols-2 gap-1.5">
          {[['A','Họ và tên *'],['B','Username'],['C','Mật khẩu'],['D','Email'],['E','Role (STUDENT/TEACHER)'],['F','Mã SV/GV'],['G','Lớp/Khoa']].map(([col,lbl])=>(
            <div key={col} className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-accent/20 text-accent text-xs font-mono font-bold flex items-center justify-center shrink-0">{col}</span><span className="text-xs text-[var(--text-3)]">{lbl}</span></div>
          ))}
        </div>
        <p className="text-xs text-[var(--text-3)] mt-2 opacity-70">* bắt buộc · B,C để trống = tự sinh · E để trống = STUDENT</p>
      </div>
      <div onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0])}} onClick={()=>inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragging?'border-accent bg-accent/10':'border-[var(--border-strong)] hover:border-accent/50 hover:bg-[var(--bg-elevated)]/30'}`}>
        <input ref={inputRef} type="file" accept=".xlsx" className="hidden" onChange={e=>handleFile(e.target.files[0])}/>
        
        {file?<><p className="text-[var(--text-1)] font-medium text-sm">{file.name}</p><p className="text-[var(--text-3)] text-xs mt-1">{(file.size/1024).toFixed(1)} KB</p></>:<><p className="text-[var(--text-2)] text-sm">Kéo thả hoặc click để chọn</p><p className="text-[var(--text-3)] text-xs mt-1">chỉ .xlsx</p></>}
      </div>
      {error && <div className="bg-danger/8 border border-danger/20 rounded-lg px-4 py-2.5"><p className="text-danger text-sm">⚠ {error}</p></div>}
      <div className="flex gap-3">
        <button onClick={onClose} className="btn-secondary flex-1">Hủy</button>
        <button onClick={handleImport} disabled={!file||loading} className="btn-primary flex-1">
          {loading?<span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Đang import...</span>:'Import người dùng'}
        </button>
      </div>
    </div>
  )
}


function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [modalTab, setModalTab] = useState('create')
  const [success, setSuccess] = useState(null)

  const f = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await userApi.createUser(form)
      onCreated()
      setSuccess({
        email: form.email,
        hasRealEmail: form.email && !form.email.endsWith('@school.edu.vn')
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally { setSaving(false) }
  }

  const isStudent = form.role === 'STUDENT'
  const isTeacher = form.role === 'TEACHER'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-[var(--border-base)] shrink-0">
          <h2 className="section-title">Thêm tài khoản</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border-base)] shrink-0">
          {[{key:'create',label:'Tạo thủ công'},{key:'import',label:'Import Excel'}].map(t=>(
            <button key={t.key} type="button" onClick={()=>setModalTab(t.key)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${modalTab===t.key?'text-accent border-b-2 border-accent -mb-px':'text-[var(--text-3)] hover:text-[var(--text-2)]'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {modalTab==='import' ? <TabImportAdmin onClose={onClose} onImported={()=>{onCreated();onClose()}}/> :
        success ? (
          <div className="p-7 space-y-4 text-center">
            
            <p className="text-[var(--text-1)] font-semibold">Tạo tài khoản thành công!</p>
            {success.hasRealEmail
              ? <p className="text-xs text-accent">✉ Đã gửi thông tin đăng nhập tới {success.email}</p>
              : <p className="text-xs text-[var(--text-3)]">Không có email — tài khoản chưa nhận được thông báo</p>
            }
            <div className="flex gap-3 mt-4">
              <button onClick={()=>{setSuccess(null);setForm(emptyForm)}} className="btn-secondary flex-1">➕ Tạo tiếp</button>
              <button onClick={onClose} className="btn-primary flex-1">Đóng</button>
            </div>
          </div>
        ) :
        <form onSubmit={handleSubmit} className="p-7 overflow-y-auto space-y-5">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-danger/8 border border-danger/20 text-danger text-sm">{error}</div>
          )}

          {/* Vai trò — đặt lên đầu để các field bên dưới render đúng */}
          <div>
            <label className="input-label">Vai trò *</label>
            <div className="flex gap-2">
              {[
                { v: 'TEACHER', label: 'Giảng viên', cls: 'border-info/40 bg-info/10 text-info' },
                { v: 'STUDENT', label: 'Sinh viên',  cls: 'border-success/40 bg-success/t/10 text-success' },
                { v: 'ADMIN',   label: 'Admin',       cls: 'border-danger/40 bg-danger/100 text-danger' },
              ].map(opt => (
                <button key={opt.v} type="button"
                  onClick={() => setForm(p => ({ ...p, role: opt.v }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    form.role === opt.v ? opt.cls : 'border-[var(--border-strong)] text-[var(--text-3)] hover:text-[var(--text-1)]'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Thông tin đăng nhập */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Username *</label>
              <input className="input-field" value={form.username} onChange={f('username')} required autoFocus placeholder="vd: nguyenvana" />
            </div>
            <div>
              <label className="input-label">Mật khẩu *</label>
              <input type="password" className="input-field" value={form.password} onChange={f('password')} required placeholder="Tối thiểu 6 ký tự" />
            </div>
          </div>

          <div>
            <label className="input-label">Email <span className="text-[var(--text-3)] font-normal">(tuỳ chọn)</span></label>
            <input type="email" className="input-field" value={form.email} onChange={f('email')} placeholder="vd: nguyenvana@email.com" />
          </div>

          <div>
            <label className="input-label">Họ tên</label>
            <input className="input-field" value={form.fullName} onChange={f('fullName')} placeholder="Nhập họ và tên đầy đủ" />
          </div>

          {/* ── Số điện thoại (chung) ── */}
          {(isStudent || isTeacher) && (
            <div className="pt-2 border-t border-[var(--border-base)]">
              <p className={`text-xs font-medium uppercase tracking-wider text-[var(--text-3)] mb-3`}>
                {isStudent ? 'Thông tin sinh viên' : 'Thông tin giảng viên'}
              </p>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-base)] mb-3">
                <svg className="w-4 h-4 text-warning shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>
                </svg>
                <p className="text-xs text-[var(--text-2)]">
                  Mã {isStudent ? 'sinh viên' : 'giảng viên'} sẽ được <span className="text-accent font-medium">tự động tạo</span> (vd: {isStudent ? 'SV20240001' : 'GV20240001'})
                </p>
              </div>
              <div>
                <label className="input-label">Số điện thoại</label>
                <input className="input-field" value={form.phone}
                  onChange={f('phone')} placeholder="vd: 0912345678" />
              </div>
            </div>
          )}
        </form>
        }
      

        {/* Footer */}
        {modalTab !== 'import' && !success && (
        <div className="flex gap-3 px-7 py-4 border-t border-[var(--border-base)] shrink-0">
          <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                Đang tạo...
              </span>
            ) : 'Tạo tài khoản'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
        </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────

export default function AdminUsers() {
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [deleting, setDeleting] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [resetTarget, setResetTarget] = useState(null)  // user cần reset password
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 10
  const [activeTab, setActiveTab]   = useState('ALL')

  const load = () => {
    setLoading(true)
    userApi.getAll()
      .then(r => setUsers(r.data.data || []))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])
  useEffect(() => { setPage(0) }, [activeTab, search])

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa người dùng này?')) return
    setDeleting(id)
    try {
      await userApi.delete(id)
      setUsers(prev => prev.filter(u => u.id !== id))
    } finally { setDeleting(null) }
  }

  const byTab = activeTab === 'ALL' ? users : users.filter(u => u.roles?.includes(activeTab))
  const filtered = byTab.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const counts = {
    ALL:     users.length,
    ADMIN:   users.filter(u => u.roles?.includes('ADMIN')).length,
    TEACHER: users.filter(u => u.roles?.includes('TEACHER')).length,
    STUDENT: users.filter(u => u.roles?.includes('STUDENT')).length,
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={load} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Quản lý tài khoản</h1>
          <p className="text-[var(--text-2)] text-sm mt-1">{users.length} tài khoản trong hệ thống</p>
        </div>
        <div className="flex gap-2">
<button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Tạo tài khoản
          </button>
        </div>
      </div>

      {/* Role tabs */}
      <div className="flex gap-2 border-b border-[var(--border-subtle)] pb-0">
        {ROLE_TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? 'border-accent text-accent'
                : 'border-transparent text-[var(--text-3)] hover:text-[var(--text-2)]'
            }`}>
            {tab.label}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? 'bg-accent/20 text-accent' : 'bg-[var(--bg-elevated)] text-[var(--text-3)]'
            }`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input className="input-field pl-9" placeholder="Tìm tên, email, username..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={load} className="btn-secondary">Làm mới</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-base)]">
                  {['STT', 'Họ tên', 'Username', 'Email', 'Mã số', 'Vai trò', 'Trạng thái', ''].map(h => (
                    <th key={h} className="text-left text-xs text-[var(--text-3)] uppercase tracking-wider pb-3 pr-4 font-mono">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {paginated.map((u, idx) => { const globalIdx = page * PAGE_SIZE + idx;
                  const code = u.studentProfile?.studentCode || u.teacherProfile?.teacherCode
                  return (
                    <tr key={u.id} className="hover:bg-[var(--bg-elevated)]/30 transition-colors">
                      <td className="py-3 pr-4 text-xs text-[var(--text-3)] font-mono">{globalIdx + 1}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[var(--border-base)] border border-[var(--border-strong)] flex items-center justify-center shrink-0">
                            <span className="text-[var(--text-2)] text-xs font-semibold">
                              {u.fullName?.[0]?.toUpperCase() || u.username?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-[var(--text-1)] text-sm font-medium">{u.fullName || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-sm text-[var(--text-2)] font-mono">{u.username}</td>
                      <td className="py-3 pr-4 text-sm text-[var(--text-2)]">{u.email || '—'}</td>
                      {/* Cột mã số */}
                      <td className="py-3 pr-4">
                        {code
                          ? <span className="text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-0.5 rounded">{code}</span>
                          : <span className="text-[var(--text-3)] text-xs">—</span>
                        }
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-1 flex-wrap">
                          {u.roles?.map(r => (
                            <span key={r} className={
                              r === 'ADMIN' ? 'badge-red' :
                              r === 'TEACHER' ? 'badge-cyan' : 'badge-green'
                            }>
                              {r === 'ADMIN' ? 'Admin' : r === 'TEACHER' ? 'Giảng viên' : 'Sinh viên'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={u.status === 'ACTIVE' ? 'badge-green' : 'badge-muted'}>
                          {u.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setResetTarget(u)}
                            className="btn-ghost text-[var(--text-3)] hover:text-accent hover:bg-accent/10 px-2 py-1 text-xs">
                            🔑 Reset
                          </button>
                          <button onClick={() => handleDelete(u.id)} disabled={deleting === u.id}
                            className="btn-ghost text-danger/70 hover:text-danger hover:bg-danger/8 px-2 py-1 text-xs">
                            {deleting === u.id ? '...' : 'Xóa'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-8 text-[var(--text-3)] text-sm">
                {search ? 'Không tìm thấy kết quả' : 'Chưa có tài khoản nào'}
              </div>
            )}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">

            {totalPages > 1 && (
              <Pagination page={page} totalPages={totalPages} totalElements={filtered.length} size={PAGE_SIZE} onPageChange={p => setPage(p)} />
            )}
          </div>
        )}
      </div>
      {resetTarget && (
        <ResetPasswordModal user={resetTarget} onClose={() => setResetTarget(null)} />
      )}
    </div>
  )
}
