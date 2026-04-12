// src/components/common/CreateStudentModal.jsx
// Modal gộp: Tab 1 = Tạo thủ công | Tab 2 = Import Excel
import { useState, useRef } from 'react'
import { userApi } from '../../api/services'
import api from '../../api/client'

const X_ICON = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
  </svg>
)

function TabCreate({ courseId, onClose, onCreated }) {
  const [form, setForm] = useState({ username:'', fullName:'', password:'', email:'', className:'', courseId: courseId||'' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [result, setResult] = useState(null)
  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError('') }

  const suggestUsername = () => {
    if (!form.fullName) return
    const parts = form.fullName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').split(' ')
    const last = parts[parts.length-1]
    const initials = parts.slice(0,-1).map(p=>p[0]||'').join('')
    set('username', last + initials + Math.floor(Math.random()*90+10))
  }

  const handleSubmit = async () => {
    if (!form.username.trim()) return setError('Username không được để trống')
    if (!form.fullName.trim())  return setError('Họ tên không được để trống')
    setSaving(true)
    try {
      const r = await userApi.createStudent({ username:form.username.trim(), fullName:form.fullName.trim(), password:form.password.trim()||null, email:form.email.trim()||null, studentCode:null, className:form.className.trim()||null, courseId:form.courseId?Number(form.courseId):null })
      setResult(r.data.data); onCreated?.()
    } catch (err) {
      const msg = err?.response?.data?.message||''
      setError(msg.toLowerCase().includes('exist') ? 'Username đã tồn tại, dùng username khác' : msg||'Tạo tài khoản thất bại')
    } finally { setSaving(false) }
  }

  if (result) return (
    <div className="space-y-5">
      <div className="text-center"><div className="text-4xl mb-2"></div><p className="text-[var(--text-1)] font-semibold">Tạo tài khoản thành công!</p>
        {result.enrolledCourseId && <p className="text-xs text-success mt-1">Đã gắn vào lớp học</p>}
        {result.email && !result.email.endsWith('@school.edu.vn')
          ? <p className="text-xs text-accent mt-1">✉ Đã gửi thông tin đăng nhập tới {result.email}</p>
          : <p className="text-xs text-[var(--text-3)] mt-1"> Không có email — sinh viên chưa nhận được thông báo</p>
        }</div>
      <div className="bg-[var(--bg-elevated)] rounded-xl p-4 space-y-3 border border-[var(--border-strong)]">
        <p className="text-xs text-[var(--text-3)] uppercase tracking-wider font-medium">Thông tin đăng nhập</p>
        {[{label:'Họ tên',value:result.fullName},{label:'Username',value:result.username,mono:true},{label:'Mật khẩu',value:result.plainPassword,mono:true,highlight:true},result.email&&{label:'Email',value:result.email},result.studentCode&&{label:'Mã SV',value:result.studentCode,mono:true}].filter(Boolean).map(r=>(
          <div key={r.label} className="flex justify-between items-center"><span className="text-[var(--text-3)] text-sm">{r.label}</span><span className={`text-sm font-medium ${r.mono?'font-mono':''} ${r.highlight?'text-accent bg-accent/10 px-2 py-0.5 rounded':'text-[var(--text-1)]'}`}>{r.value}</span></div>
        ))}
      </div>
      <div className="bg-warning/10 border border-warning/20 rounded-lg px-3 py-2.5"><p className="text-warning text-xs"> Lưu lại mật khẩu ngay — sau khi đóng sẽ không xem lại được.</p></div>
      <div className="flex gap-3">
        <button onClick={()=>navigator.clipboard.writeText(`Username: ${result.username}\nMật khẩu: ${result.plainPassword}`)} className="btn-secondary flex-1 text-sm">Sao chép</button>
        <button onClick={()=>{setResult(null);setForm({username:'',fullName:'',password:'',email:'',className:'',courseId:courseId||''})}} className="btn-ghost flex-1 text-sm border border-[var(--border-base)]">Tạo thêm</button>
      </div>
      <button onClick={onClose} className="btn-primary w-full">Đóng</button>
    </div>
  )

  return (
    <div className="space-y-5">
      <div><label className="block text-sm text-[var(--text-2)] mb-1.5">Họ và tên <span className="text-danger">*</span></label><input value={form.fullName} onChange={e=>set('fullName',e.target.value)} onBlur={suggestUsername} className="input-field" placeholder="Nguyễn Văn A" autoFocus/></div>
      <div><label className="block text-sm text-[var(--text-2)] mb-1.5">Username <span className="text-danger">*</span></label>
        <div className="flex gap-2"><input value={form.username} onChange={e=>set('username',e.target.value)} className="input-field flex-1 font-mono" placeholder="vd: nguyenvana01"/><button type="button" onClick={suggestUsername} className="btn-ghost px-3 text-xs text-[var(--text-3)] border border-[var(--border-base)] rounded-lg hover:text-accent" title="Gợi ý">◎</button></div>
      </div>
      <div><label className="block text-sm text-[var(--text-2)] mb-1.5">Mật khẩu <span className="text-[var(--text-3)] text-xs">(để trống → username+"123")</span></label><input value={form.password} onChange={e=>set('password',e.target.value)} type="text" className="input-field font-mono" placeholder={`${form.username||'username'}123`}/></div>
      <div>
        <label className="block text-sm text-[var(--text-2)] mb-1.5">Lớp học</label>
        <input value={form.className} onChange={e=>set('className',e.target.value)} className="input-field" placeholder="CNTT-K22A"/>
      </div>
      <div><label className="block text-sm text-[var(--text-2)] mb-1.5">Email <span className="text-[var(--text-3)] text-xs">(tuỳ chọn)</span></label><input value={form.email} onChange={e=>set('email',e.target.value)} type="email" className="input-field" placeholder="student@gmail.com"/></div>
      {error && <div className="bg-danger/10 border border-danger/30 rounded-lg px-4 py-2.5"><p className="text-danger text-sm"> {error}</p></div>}
      <div className="flex gap-3 pt-1">
        <button onClick={onClose} className="btn-secondary flex-1">Hủy</button>
        <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">
          {saving ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Đang tạo...</span> : 'Tạo tài khoản'}
        </button>
      </div>
    </div>
  )
}

function TabImport({ courseId, onClose, onImported }) {
  const [file, setFile]         = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')
  const inputRef                = useRef()

  const handleFile = (f) => { if (!f) return; if (!f.name.endsWith('.xlsx')) return setError('Chỉ hỗ trợ file .xlsx'); setFile(f); setError('') }
  const handleImport = async () => {
    if (!file) return setError('Chọn file Excel trước')
    setLoading(true); setError('')
    try {
      const fd = new FormData(); fd.append('file', file)
      const r = await api.post(courseId ? `/users/students/import?courseId=${courseId}` : '/users/students/import', fd, { headers: {'Content-Type':'multipart/form-data'} })
      setResult(r.data.data); onImported?.()
    } catch (err) { setError(err?.response?.data?.message||'Import thất bại') } finally { setLoading(false) }
  }

  if (result) return (
    <div className="space-y-5">
      <div className="text-center"><div className="text-4xl mb-2">{result.errorCount===0?'':''}</div><p className="text-[var(--text-1)] font-semibold">Import hoàn tất</p></div>
      <div className="grid grid-cols-3 gap-3">
        {[{label:'Thành công',value:result.successCount,color:'text-success'},{label:'Lỗi',value:result.errorCount,color:'text-danger'},{label:'Gửi email',value:result.emailSentCount,color:'text-accent'}].map(s=>(
          <div key={s.label} className="bg-[var(--bg-elevated)] rounded-xl p-3 text-center"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-[var(--text-3)] text-xs mt-0.5">{s.label}</p></div>
        ))}
      </div>
      {result.errors?.length>0 && <div className="bg-danger/5 border border-danger/20 rounded-xl p-3 max-h-32 overflow-y-auto"><p className="text-xs text-danger font-medium mb-2">Chi tiết lỗi:</p>{result.errors.map((e,i)=><p key={i} className="text-xs text-[var(--text-3)] py-0.5">• {e}</p>)}</div>}
      {result.emailSentCount>0 && <div className="bg-accent/5 border border-accent/20 rounded-lg px-3 py-2"><p className="text-accent text-xs">✉ Đã gửi email đến {result.emailSentCount} sinh viên.</p></div>}
      <button onClick={onClose} className="btn-primary w-full">Đóng</button>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between bg-[var(--bg-elevated)] rounded-xl px-4 py-3">
        <div><p className="text-sm font-medium text-[var(--text-1)]">File mẫu Excel</p><p className="text-xs text-[var(--text-3)]">Tải về và điền theo đúng format</p></div>
        <a href="/template_import_sinhvien.xlsx" download className="btn-ghost text-xs px-3 py-1.5 text-accent border border-accent/30 rounded-lg hover:bg-accent/10">Tải mẫu</a>
      </div>
      <div className="bg-[var(--bg-elevated)]/50 rounded-xl p-3">
        <p className="text-xs text-[var(--text-3)] font-medium mb-2 uppercase tracking-wider">Cột trong file Excel</p>
        <div className="grid grid-cols-3 gap-1.5">
          {[['A','Họ và tên *'],['B','Username'],['C','Mật khẩu'],['D','Email'],['E','Mã sinh viên'],['F','Lớp học']].map(([col,lbl])=>(
            <div key={col} className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-accent/20 text-accent text-xs font-mono font-bold flex items-center justify-center shrink-0">{col}</span><span className="text-xs text-[var(--text-3)]">{lbl}</span></div>
          ))}
        </div>
        <p className="text-xs text-[var(--text-3)] mt-2 opacity-70">* bắt buộc · B,C để trống = tự sinh · D dùng gửi email</p>
      </div>
      <div onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0])}} onClick={()=>inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragging?'border-[var(--accent)] bg-[var(--accent-subtle)] shadow-sm':'border-[var(--border-strong)] hover:border-accent/50 hover:bg-[var(--bg-elevated)]/30'}`}>
        <input ref={inputRef} type="file" accept=".xlsx" className="hidden" onChange={e=>handleFile(e.target.files[0])}/>
        
        {file ? <><p className="text-[var(--text-1)] font-medium text-sm">{file.name}</p><p className="text-[var(--text-3)] text-xs mt-1">{(file.size/1024).toFixed(1)} KB</p></> : <><p className="text-[var(--text-2)] text-sm">Kéo thả hoặc click để chọn</p><p className="text-[var(--text-3)] text-xs mt-1">chỉ hỗ trợ .xlsx</p></>}
      </div>
      {error && <div className="bg-danger/10 border border-danger/30 rounded-lg px-4 py-2.5"><p className="text-danger text-sm"> {error}</p></div>}
      <div className="flex gap-3">
        <button onClick={onClose} className="btn-secondary flex-1">Hủy</button>
        <button onClick={handleImport} disabled={!file||loading} className="btn-primary flex-1">
          {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Đang import...</span> : 'Import sinh viên'}
        </button>
      </div>
    </div>
  )
}

export default function CreateStudentModal({ courseId, courseName, onClose, onCreated }) {
  const [tab, setTab] = useState('create')
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-7 py-5 border-b border-[var(--border-subtle)] shrink-0">
          <div>
            <h3 className="font-semibold text-[var(--text-1)]">👤 Thêm sinh viên</h3>
            {courseName && <p className="text-xs text-[var(--text-3)] mt-0.5">Lớp: {courseName}</p>}
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 text-[var(--text-3)] hover:text-[var(--text-1)]">{X_ICON}</button>
        </div>
        <div className="flex border-b border-[var(--border-subtle)] shrink-0">
          {[{key:'create',label:'Tạo thủ công'},{key:'import',label:'Import Excel'}].map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab===t.key?'text-accent border-b-2 border-accent -mb-px':'text-[var(--text-3)] hover:text-[var(--text-2)]'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="p-7 overflow-y-auto">
          {tab==='create'
            ? <TabCreate courseId={courseId} onClose={onClose} onCreated={onCreated}/>
            : <TabImport courseId={courseId} onClose={onClose} onImported={onCreated}/>
          }
        </div>
      </div>
    </div>
  )
}
