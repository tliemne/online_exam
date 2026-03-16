import { useState, useEffect } from 'react'
import { userApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'
import ChangePasswordModal from '../../components/common/ChangePasswordModal'

const ROLE_META = {
  ADMIN:   { label: 'Quản trị viên', color: 'var(--danger)', bg: 'var(--danger-subtle)'  },
  TEACHER: { label: 'Giảng viên',    color: 'var(--cyan)', bg: 'var(--cyan-subtle)'  },
  STUDENT: { label: 'Sinh viên',     color: 'var(--success)', bg: 'var(--success-subtle)'  },
}

const AVATAR_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#f43f5e',
  '#f97316','#eab308','#22c55e','#14b8a6','#3b82f6','var(--cyan)',
]

function Avatar({ name, color, avatarUrl, size = 'w-20 h-20 text-2xl' }) {
  if (avatarUrl) return (
    <div className={`${size} rounded-2xl overflow-hidden shrink-0 border-2`}
      style={{ borderColor: color + '44' }}>
      <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover"/>
    </div>
  )
  return (
    <div className={`${size} rounded-2xl flex items-center justify-center font-bold shrink-0`}
      style={{ background: color + '22', border: `2px solid ${color}44`, color }}>
      {(name || '?')[0].toUpperCase()}
    </div>
  )
}

function Field({ label, value, mono }) {
  return (
    <div>
      <p className="input-label">{label}</p>
      <p className={`text-sm text-[var(--text-1)] mt-0.5 ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
    </div>
  )
}

export default function ProfilePage() {
  const { hasRole, refreshUser } = useAuth()
  const isStudent = hasRole('STUDENT')
  const isTeacher = hasRole('TEACHER')
  const isAdmin   = hasRole('ADMIN')

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState({})
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError]     = useState('')
  const [showChangePwd, setShowChangePwd]     = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [avatarColor, setAvatarColor] = useState(
    () => localStorage.getItem('avatarColor') || AVATAR_COLORS[0]
  )
  const [uploading, setUploading] = useState(false)

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await userApi.uploadAvatar(file)
      await loadProfile()
      await refreshUser()  // cập nhật avatar trong sidebar luôn
      showMsg('Cập nhật ảnh đại diện thành công')
    } catch (err) {
      setError(err.response?.data?.message || 'Upload thất bại')
    } finally { setUploading(false) }
  }

  const loadProfile = () =>
    userApi.myProfile().then(r => {
      const p = r.data.data
      setProfile(p)
      // Gộp account + profile vào 1 form
      setForm({
        fullName: p.account?.fullName || '',
        email:    p.account?.email    || '',
        ...(p.studentProfile || p.teacherProfile || {}),
      })
    })

  useEffect(() => { loadProfile().finally(() => setLoading(false)) }, [])

  const showMsg = (msg) => { setSuccess(msg); setError(''); setTimeout(() => setSuccess(''), 3000) }

    const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (isStudent)      await userApi.updateStudentProfile(form)
      else if (isTeacher) await userApi.updateTeacherProfile(form)
      else                await userApi.updateMe({ fullName: form.fullName, email: form.email })
      await loadProfile(); setEditing(false); showMsg('Cập nhật thành công')
    } catch (err) { setError(err.response?.data?.message || 'Có lỗi xảy ra') }
    finally { setSaving(false) }
  }

  const pickColor = (c) => { setAvatarColor(c); localStorage.setItem('avatarColor', c); setShowColorPicker(false) }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
    </div>
  )

  const acc      = profile?.account
  const userRole = acc?.roles?.[0]
  const rm       = ROLE_META[userRole] || { label: userRole, color: 'var(--accent)', bg: 'var(--bg-elevated)' }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="page-title">Hồ sơ cá nhân</h1>

      {success && <div className="px-4 py-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm">✓ {success}</div>}
      {error   && <div className="px-4 py-3 rounded-lg bg-danger/10  border border-danger/20  text-danger  text-sm">{error}</div>}

      <div className="card p-6">
        {/* Header: avatar + tên + role */}
        <div className="flex items-start gap-5">
          <div className="relative shrink-0">
            <Avatar name={acc?.fullName || acc?.username} color={avatarColor} avatarUrl={acc?.avatarUrl} />
            {/* Upload ảnh */}
            <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-[var(--bg-surface)] text-white text-[10px] flex items-center justify-center cursor-pointer"
              style={{ background: avatarColor }} title="Đổi ảnh đại diện">
              {uploading ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"/> : '📷'}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading}/>
            </label>
            {/* Đổi màu nền (chỉ hiện khi chưa có ảnh) */}
            {!acc?.avatarUrl && (
              <>
                <button onClick={() => setShowColorPicker(p => !p)}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full border border-[var(--bg-surface)] text-white text-[9px] flex items-center justify-center"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-2)' }} title="Đổi màu">🎨</button>
                {showColorPicker && (
                  <div className="absolute top-full left-0 mt-2 p-2 rounded-xl border shadow-lg z-10 grid grid-cols-5 gap-1.5"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-base)' }}>
                    {AVATAR_COLORS.map(c => (
                      <button key={c} onClick={() => pickColor(c)}
                        className="w-6 h-6 rounded-full hover:scale-110 transition-transform"
                        style={{ background: c, outline: c === avatarColor ? `2px solid ${c}` : 'none', outlineOffset: 2 }}/>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-1)]">{acc?.fullName || acc?.username}</h2>
                <p className="text-sm text-[var(--text-3)] font-mono mt-0.5">@{acc?.username}</p>
                <span className="inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ color: rm.color, background: rm.bg }}>{rm.label}</span>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setShowChangePwd(true)} className="btn-ghost text-sm px-3 py-1.5">Đổi mật khẩu</button>
                {!editing && <button onClick={() => setEditing(true)} className="btn-secondary text-sm py-1.5">Chỉnh sửa</button>}
              </div>
            </div>
          </div>
        </div>

        {/* View mode */}
        {!editing && (
          <div className="mt-5 pt-5 border-t border-[var(--border-base)] grid grid-cols-2 gap-x-6 gap-y-4">
            <Field label="Họ và tên" value={acc?.fullName} />
            <Field label="Email"     value={acc?.email} />
            <Field label="Trạng thái" value={acc?.status === 'ACTIVE' ? '✓ Hoạt động' : '✗ Bị khóa'} />
            {isAdmin && <Field label="Mã Admin" value={acc?.adminCode} mono />}
            {isStudent && <>
              <Field label="Mã sinh viên" value={profile?.studentProfile?.studentCode} mono />
              <Field label="Lớp"          value={profile?.studentProfile?.className} />
              <Field label="Điện thoại"   value={profile?.studentProfile?.phone} />
              <Field label="Ngày sinh"    value={profile?.studentProfile?.dateOfBirth} />
            </>}
            {isTeacher && <>
              <Field label="Mã giảng viên" value={profile?.teacherProfile?.teacherCode} mono />
              <Field label="Khoa"          value={profile?.teacherProfile?.department} />
              <Field label="Điện thoại"    value={profile?.teacherProfile?.phone} />
              <Field label="Chuyên ngành"  value={profile?.teacherProfile?.specialization} />
            </>}
          </div>
        )}

        {/* Edit mode — 1 form duy nhất */}
        {editing && (
          <form onSubmit={handleSave} className="mt-5 pt-5 border-t border-[var(--border-base)] space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Họ và tên</label>
                <input className="input-field" value={form.fullName || ''}
                  onChange={e => setForm({...form, fullName: e.target.value})} />
              </div>
              <div>
                <label className="input-label">Email</label>
                <input type="email" className="input-field" value={form.email || ''}
                  onChange={e => setForm({...form, email: e.target.value})} />
              </div>
            </div>

            {/* Student fields */}
            {isStudent && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Mã sinh viên</label>
                  <div className="input-field bg-[var(--bg-elevated)] flex items-center justify-between cursor-not-allowed">
                    <span className="font-mono text-sm">{profile?.studentProfile?.studentCode || '—'}</span>
                    <span className="text-xs text-[var(--text-3)]">Không thể thay đổi</span>
                  </div>
                </div>
                <div>
                  <label className="input-label">Lớp</label>
                  <input className="input-field" value={form.className || ''}
                    onChange={e => setForm({...form, className: e.target.value})} />
                </div>
                <div>
                  <label className="input-label">Điện thoại</label>
                  <input className="input-field" value={form.phone || ''}
                    onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div>
                  <label className="input-label">Ngày sinh</label>
                  <input type="date" className="input-field"
                    value={form.dateOfBirth ? form.dateOfBirth.split('T')[0] : ''}
                    onChange={e => setForm({...form, dateOfBirth: e.target.value})} />
                </div>
              </div>
            )}

            {/* Teacher fields */}
            {isTeacher && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Mã giảng viên</label>
                  <div className="input-field bg-[var(--bg-elevated)] flex items-center justify-between cursor-not-allowed">
                    <span className="font-mono text-sm">{profile?.teacherProfile?.teacherCode || '—'}</span>
                    <span className="text-xs text-[var(--text-3)]">Không thể thay đổi</span>
                  </div>
                </div>
                <div>
                  <label className="input-label">Khoa</label>
                  <input className="input-field" value={form.department || ''}
                    onChange={e => setForm({...form, department: e.target.value})} />
                </div>
                <div>
                  <label className="input-label">Điện thoại</label>
                  <input className="input-field" value={form.phone || ''}
                    onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div>
                  <label className="input-label">Chuyên ngành</label>
                  <input className="input-field" value={form.specialization || ''}
                    onChange={e => setForm({...form, specialization: e.target.value})} />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary text-sm">
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary text-sm">Hủy</button>
            </div>
          </form>
        )}
      </div>

      {showChangePwd && <ChangePasswordModal onClose={() => setShowChangePwd(false)} />}
    </div>
  )
}
