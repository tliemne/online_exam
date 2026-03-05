import { useState, useEffect } from 'react'
import { userApi } from '../../api/services'

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

function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const f = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await userApi.createUser(form)
      onCreated(); onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally { setSaving(false) }
  }

  const isStudent = form.role === 'STUDENT'
  const isTeacher = form.role === 'TEACHER'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-800 border border-surface-600 rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-600 shrink-0">
          <div>
            <h2 className="section-title">Tạo tài khoản mới</h2>
            <p className="text-text-muted text-xs mt-0.5">
              {isStudent ? 'Sinh viên' : isTeacher ? 'Giảng viên' : 'Quản trị viên'}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-accent/10 border border-red-accent/30 text-red-accent text-sm">{error}</div>
          )}

          {/* Vai trò — đặt lên đầu để các field bên dưới render đúng */}
          <div>
            <label className="label">Vai trò *</label>
            <div className="flex gap-2">
              {[
                { v: 'TEACHER', label: 'Giảng viên', cls: 'border-cyan-accent/40 bg-cyan-accent/10 text-cyan-accent' },
                { v: 'STUDENT', label: 'Sinh viên',  cls: 'border-green-accent/40 bg-green-accent/10 text-green-accent' },
                { v: 'ADMIN',   label: 'Admin',       cls: 'border-red-accent/40 bg-red-accent/10 text-red-accent' },
              ].map(opt => (
                <button key={opt.v} type="button"
                  onClick={() => setForm(p => ({ ...p, role: opt.v }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    form.role === opt.v ? opt.cls : 'border-surface-500 text-text-muted hover:text-text-primary'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Thông tin đăng nhập */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Username *</label>
              <input className="input-field" value={form.username} onChange={f('username')} required autoFocus placeholder="vd: nguyenvana" />
            </div>
            <div>
              <label className="label">Mật khẩu *</label>
              <input type="password" className="input-field" value={form.password} onChange={f('password')} required placeholder="Tối thiểu 6 ký tự" />
            </div>
          </div>

          <div>
            <label className="label">Email *</label>
            <input type="email" className="input-field" value={form.email} onChange={f('email')} required placeholder="vd: nguyenvana@email.com" />
          </div>

          <div>
            <label className="label">Họ tên</label>
            <input className="input-field" value={form.fullName} onChange={f('fullName')} placeholder="Nhập họ và tên đầy đủ" />
          </div>

          {/* ── Số điện thoại (chung) ── */}
          {(isStudent || isTeacher) && (
            <div className="pt-2 border-t border-surface-600">
              <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isStudent ? 'text-green-accent' : 'text-cyan-accent'}`}>
                {isStudent ? 'Thông tin sinh viên' : 'Thông tin giảng viên'}
              </p>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-700 border border-surface-600 mb-3">
                <svg className="w-4 h-4 text-amber-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>
                </svg>
                <p className="text-xs text-text-secondary">
                  Mã {isStudent ? 'sinh viên' : 'giảng viên'} sẽ được <span className="text-accent font-medium">tự động tạo</span> (vd: {isStudent ? 'SV20240001' : 'GV20240001'})
                </p>
              </div>
              <div>
                <label className="label">Số điện thoại</label>
                <input className="input-field" value={form.phone}
                  onChange={f('phone')} placeholder="vd: 0912345678" />
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-surface-600 shrink-0">
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
  const [activeTab, setActiveTab]   = useState('ALL')

  const load = () => {
    setLoading(true)
    userApi.getAll()
      .then(r => setUsers(r.data.data || []))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

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
          <p className="text-text-secondary text-sm mt-1">{users.length} tài khoản trong hệ thống</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          Tạo tài khoản
        </button>
      </div>

      {/* Role tabs */}
      <div className="flex gap-2 border-b border-surface-700 pb-0">
        {ROLE_TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}>
            {tab.label}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? 'bg-accent/20 text-accent' : 'bg-surface-700 text-text-muted'
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
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input className="input-field pl-9" placeholder="Tìm tên, email, username..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={load} className="btn-secondary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Làm mới
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-600">
                  {['STT', 'Họ tên', 'Username', 'Email', 'Mã số', 'Vai trò', 'Trạng thái', ''].map(h => (
                    <th key={h} className="text-left text-xs text-text-muted uppercase tracking-wider pb-3 pr-4 font-mono">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700">
                {filtered.map((u, idx) => {
                  const code = u.studentProfile?.studentCode || u.teacherProfile?.teacherCode
                  return (
                    <tr key={u.id} className="hover:bg-surface-700/30 transition-colors">
                      <td className="py-3 pr-4 text-xs text-text-muted font-mono">{idx + 1}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
                            <span className="text-accent text-xs font-bold">
                              {u.fullName?.[0]?.toUpperCase() || u.username?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-text-primary text-sm font-medium">{u.fullName || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-sm text-text-secondary font-mono">{u.username}</td>
                      <td className="py-3 pr-4 text-sm text-text-secondary">{u.email || '—'}</td>
                      {/* Cột mã số */}
                      <td className="py-3 pr-4">
                        {code
                          ? <span className="text-xs font-mono bg-surface-700 border border-surface-500 px-2 py-0.5 rounded">{code}</span>
                          : <span className="text-text-muted text-xs">—</span>
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
                        <button onClick={() => handleDelete(u.id)} disabled={deleting === u.id}
                          className="btn-ghost text-red-accent/70 hover:text-red-accent hover:bg-red-accent/10 px-2 py-1 text-xs">
                          {deleting === u.id ? '...' : 'Xóa'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-8 text-text-muted text-sm">
                {search ? 'Không tìm thấy kết quả' : 'Chưa có tài khoản nào'}
              </div>
            )}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="mt-4 pt-3 border-t border-surface-700 text-xs text-text-muted">
            Hiển thị {filtered.length} / {byTab.length} tài khoản
          </div>
        )}
      </div>
    </div>
  )
}
