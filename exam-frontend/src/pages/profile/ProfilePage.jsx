import { useState, useEffect } from 'react'
import { userApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'
import ChangePasswordModal from '../../components/common/ChangePasswordModal'

const ROLE_MAP   = { ADMIN: 'Quản trị viên', TEACHER: 'Giảng viên', STUDENT: 'Sinh viên' }
const ROLE_BADGE = { ADMIN: 'badge-red',      TEACHER: 'badge-cyan',  STUDENT: 'badge-green' }

function Field({ label, value, mono }) {
  return (
    <div>
      <p className="input-label">{label}</p>
      <p className={`text-sm text-[var(--text-1)] ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
    </div>
  )
}

export default function ProfilePage() {
  const { user, hasRole } = useAuth()
  const [profile, setProfile]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [editing, setEditing]       = useState(false)
  const [form, setForm]             = useState({})
  const [saving, setSaving]         = useState(false)
  const [success, setSuccess]       = useState(false)
  const [error, setError]           = useState('')
  const [showChangePwd, setShowChangePwd] = useState(false)

  const loadProfile = () =>
    userApi.myProfile().then(r => {
      const p = r.data.data
      setProfile(p)
      const base = { email: p.account?.email || '' }
      setForm(p.studentProfile ? { ...base, ...p.studentProfile }
            : p.teacherProfile ? { ...base, ...p.teacherProfile }
            : base)
    })

  useEffect(() => { loadProfile().finally(() => setLoading(false)) }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      if (hasRole('STUDENT'))      await userApi.updateStudentProfile(form)
      else if (hasRole('TEACHER')) await userApi.updateTeacherProfile(form)
      await loadProfile()
      setSuccess(true); setEditing(false)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally { setSaving(false) }
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
    </div>
  )

  const acc      = profile?.account
  const userRole = acc?.roles?.[0]

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="page-title">Hồ sơ cá nhân</h1>

      {success && (
        <div className="px-4 py-3 rounded-md bg-success/10 border border-success/20 text-success text-sm">
          Cập nhật thành công
        </div>
      )}
      {error && (
        <div className="px-4 py-3 rounded-md bg-danger/10 border border-danger/20 text-danger text-sm">
          {error}
        </div>
      )}

      {/* Account */}
      <div className="card">
        <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
          <h2 className="section-title">Tài khoản</h2>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl bg-[var(--border-base)] border border-[var(--border-strong)]
              flex items-center justify-center text-lg font-semibold text-[var(--text-1)] shrink-0">
              {acc?.fullName?.[0]?.toUpperCase() || acc?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-base font-semibold text-[var(--text-1)]">{acc?.fullName || acc?.username}</p>
              <span className={`${ROLE_BADGE[userRole] || 'badge-neutral'} mt-0.5`}>
                {ROLE_MAP[userRole] || userRole}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Field label="Username" value={acc?.username} mono />
            <Field label="Email"    value={acc?.email} />
            <Field label="Họ tên"   value={acc?.fullName} />
            <Field label="Trạng thái" value={acc?.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'} />
          </div>
        </div>
      </div>

      {/* Profile chi tiết */}
      {(hasRole('STUDENT') || hasRole('TEACHER')) && (
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
            <h2 className="section-title">
              {hasRole('STUDENT') ? 'Thông tin sinh viên' : 'Thông tin giảng viên'}
            </h2>
            {!editing && (
              <div className="flex gap-2">
                <button onClick={() => setShowChangePwd(true)} className="btn-ghost text-sm py-1.5 px-3">
                  Đổi mật khẩu
                </button>
                <button onClick={() => setEditing(true)} className="btn-secondary text-sm py-1.5">
                  Chỉnh sửa
                </button>
              </div>
            )}
          </div>

          <div className="px-5 py-4">
            {!editing ? (
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {hasRole('STUDENT') ? (<>
                  <Field label="Mã sinh viên" value={profile?.studentProfile?.studentCode} mono />
                  <Field label="Lớp"          value={profile?.studentProfile?.className} />
                  <Field label="Điện thoại"   value={profile?.studentProfile?.phone} />
                  <Field label="Ngày sinh"    value={profile?.studentProfile?.dateOfBirth} />
                </>) : (<>
                  <Field label="Mã giảng viên" value={profile?.teacherProfile?.teacherCode} mono />
                  <Field label="Khoa"          value={profile?.teacherProfile?.department} />
                  <Field label="Điện thoại"    value={profile?.teacherProfile?.phone} />
                  <Field label="Chuyên ngành"  value={profile?.teacherProfile?.specialization} />
                </>)}
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="input-label">Email</label>
                  <input type="email" className="input-field" value={form.email || ''}
                    onChange={e => setForm({...form, email: e.target.value})} />
                </div>

                {/* Mã SV/GV chỉ đọc */}
                <div>
                  <label className="input-label">
                    {hasRole('STUDENT') ? 'Mã sinh viên' : 'Mã giảng viên'}
                  </label>
                  <div className="input-field bg-[var(--bg-elevated)] cursor-not-allowed flex items-center justify-between">
                    <span className="font-mono text-[var(--text-1)] text-sm">
                      {hasRole('STUDENT') ? profile?.studentProfile?.studentCode : profile?.teacherProfile?.teacherCode || '—'}
                    </span>
                    <span className="text-xs text-[var(--text-3)]">Không thể thay đổi</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {hasRole('STUDENT') ? (<>
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
                  </>) : (<>
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
                  </>)}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Hủy</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showChangePwd && <ChangePasswordModal onClose={() => setShowChangePwd(false)} />}
    </div>
  )
}
