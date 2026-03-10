import { useState, useEffect } from 'react'
import { userApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'
import ChangePasswordModal from '../../components/common/ChangePasswordModal'

export default function ProfilePage() {
  const { user, hasRole } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showChangePwd, setShowChangePwd] = useState(false)

  useEffect(() => {
    userApi.myProfile()
      .then(r => {
        setProfile(r.data.data)
        const p = r.data.data
        const base = { email: p.account?.email || '' }
        if (p.studentProfile) setForm({ ...base, ...p.studentProfile })
        else if (p.teacherProfile) setForm({ ...base, ...p.teacherProfile })
        else setForm(base)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (hasRole('STUDENT')) {
        await userApi.updateStudentProfile(form)
      } else if (hasRole('TEACHER')) {
        await userApi.updateTeacherProfile(form)
      }
      // Reload profile sau khi lưu
      const r = await userApi.myProfile()
      setProfile(r.data.data)
      const p = r.data.data
      const base = { email: p.account?.email || '' }
      if (p.studentProfile) setForm({ ...base, ...p.studentProfile })
      else if (p.teacherProfile) setForm({ ...base, ...p.teacherProfile })
      else setForm(base)
      setSuccess(true)
      setEditing(false)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  )

  const acc = profile?.account
  const roleLabel = { ADMIN: 'Quản trị viên', TEACHER: 'Giảng viên', STUDENT: 'Sinh viên' }
  const roleColor = { ADMIN: 'text-red-400', TEACHER: 'text-cyan-400', STUDENT: 'text-green-400' }
  const userRole = acc?.roles?.[0]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="page-title">Hồ sơ cá nhân</h1>

      {success && (
        <div className="px-4 py-3 rounded-lg bg-green-accent/10 border border-green-accent/30 text-green-accent text-sm">
          ✓ Cập nhật thành công!
        </div>
      )}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-accent/10 border border-red-accent/30 text-red-accent text-sm">
          {error}
        </div>
      )}

      {/* Account info */}
      <div className="card space-y-4">
        <h2 className="section-title">Thông tin tài khoản</h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center">
            <span className="text-accent text-2xl font-bold font-display">
              {acc?.fullName?.[0]?.toUpperCase() || acc?.username?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-text-primary font-semibold text-lg">{acc?.fullName || acc?.username}</p>
            <p className={`text-sm font-medium ${roleColor[userRole]}`}>{roleLabel[userRole]}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2">
          {[
            { label: 'Username', value: acc?.username },
            { label: 'Email', value: acc?.email },
            { label: 'Họ tên', value: acc?.fullName },
            { label: 'Trạng thái', value: acc?.status },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="label">{label}</p>
              <p className="text-text-primary text-sm">{value || '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Profile chi tiết — chỉ Teacher & Student */}
      {(hasRole('STUDENT') || hasRole('TEACHER')) && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">
              {hasRole('STUDENT') ? 'Thông tin sinh viên' : 'Thông tin giảng viên'}
            </h2>
            {!editing && (
              <div className="flex gap-2">
                <button onClick={() => setShowChangePwd(true)}
                  className="btn-ghost text-sm py-1.5 px-3 text-text-muted hover:text-accent border border-surface-600 rounded-lg">
                  🔑 Đổi mật khẩu
                </button>
                <button onClick={() => setEditing(true)} className="btn-secondary text-sm py-1.5">
                  Chỉnh sửa
                </button>
              </div>
            )}
          </div>

          {!editing ? (
            <div className="grid grid-cols-2 gap-4">
              {hasRole('STUDENT') ? (
                <>
                  <div><p className="label">Mã sinh viên</p><p className="text-text-primary text-sm">{profile?.studentProfile?.studentCode || '—'}</p></div>
                  <div><p className="label">Lớp</p><p className="text-text-primary text-sm">{profile?.studentProfile?.className || '—'}</p></div>
                  <div><p className="label">Số điện thoại</p><p className="text-text-primary text-sm">{profile?.studentProfile?.phone || '—'}</p></div>
                  <div><p className="label">Ngày sinh</p><p className="text-text-primary text-sm">{profile?.studentProfile?.dateOfBirth || '—'}</p></div>
                </>
              ) : (
                <>
                  <div><p className="label">Mã giảng viên</p><p className="text-text-primary text-sm">{profile?.teacherProfile?.teacherCode || '—'}</p></div>
                  <div><p className="label">Khoa</p><p className="text-text-primary text-sm">{profile?.teacherProfile?.department || '—'}</p></div>
                  <div><p className="label">Số điện thoại</p><p className="text-text-primary text-sm">{profile?.teacherProfile?.phone || '—'}</p></div>
                  <div><p className="label">Chuyên ngành</p><p className="text-text-primary text-sm">{profile?.teacherProfile?.specialization || '—'}</p></div>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input-field" value={form.email || ''}
                  onChange={e => setForm({...form, email: e.target.value})}
                  placeholder="example@gmail.com" required />
              </div>
              {hasRole('STUDENT') ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Mã sinh viên</label>
                    <div className="input-field bg-surface-700 cursor-not-allowed flex items-center gap-2">
                      <span className="font-mono text-text-primary">{profile?.studentProfile?.studentCode || '—'}</span>
                      <span className="ml-auto text-xs text-text-muted">Không thể thay đổi</span>
                    </div>
                  </div>
                  <div>
                    <label className="label">Lớp</label>
                    <input className="input-field" value={form.className || ''}
                      onChange={e => setForm({...form, className: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Số điện thoại</label>
                    <input className="input-field" value={form.phone || ''}
                      onChange={e => setForm({...form, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Ngày sinh</label>
                    <input type="date" className="input-field"
                      value={form.dateOfBirth ? form.dateOfBirth.split('T')[0] : ''}
                      onChange={e => setForm({...form, dateOfBirth: e.target.value})} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Mã giảng viên</label>
                    <div className="input-field bg-surface-700 cursor-not-allowed flex items-center gap-2">
                      <span className="font-mono text-text-primary">{profile?.teacherProfile?.teacherCode || '—'}</span>
                      <span className="ml-auto text-xs text-text-muted">Không thể thay đổi</span>
                    </div>
                  </div>
                  <div>
                    <label className="label">Khoa</label>
                    <input className="input-field" value={form.department || ''}
                      onChange={e => setForm({...form, department: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Số điện thoại</label>
                    <input className="input-field" value={form.phone || ''}
                      onChange={e => setForm({...form, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Chuyên ngành</label>
                    <input className="input-field" value={form.specialization || ''}
                      onChange={e => setForm({...form, specialization: e.target.value})} />
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Hủy</button>
              </div>
            </form>
          )}
        </div>
      )}
      {showChangePwd && (
        <ChangePasswordModal onClose={() => setShowChangePwd(false)} />
      )}
    </div>
  )
}
