import { useState } from 'react'
import { useToast } from '../../../context/ToastContext'
import { examApi } from '../../../api/services'
import DateTimePicker from '../../../components/common/DateTimePicker'

const Icon = {
  x: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-overlay">
      <div className={`bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-xl w-full shadow-modal animate-slide-up flex flex-col max-h-[90vh] ${wide ? 'max-w-2xl' : 'max-w-lg'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-base)] shrink-0">
          <h2 className="section-title">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">{Icon.x}</button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

export default function ExamFormModal({ exam, courses, onClose, onSaved }) {
  const emptyForm = {
    title: '',
    description: '',
    courseId: '',
    duration: 60,
    passScore: '',
    maxAttempts: 1,
    shuffleQuestions: false,
    showResult: true,
    allowResume: false,
    startTime: '',
    endTime: '',
  }

  const [form, setForm] = useState(exam ? {
    title: exam.title || '',
    description: exam.description || '',
    courseId: exam.courseId || '',
    duration: exam.duration || 60,
    passScore: exam.passScore ?? '',
    maxAttempts: exam.maxAttempts || 1,
    shuffleQuestions: exam.shuffleQuestions ?? false,
    showResult: exam.showResult ?? true,
    allowResume: exam.allowResume ?? false,
    startTime: exam.startTime ? exam.startTime.slice(0, 16) : '',
    endTime: exam.endTime ? exam.endTime.slice(0, 16) : '',
  } : emptyForm)

  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const fb = (k) => () => setForm({ ...form, [k]: !form[k] })

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Validate thời gian
    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      setError('Thời gian đóng thi phải sau thời gian mở thi')
      return
    }
    setSaving(true); setError('')
    try {
      const payload = {
        ...form,
        courseId: Number(form.courseId),
        durationMinutes: Number(form.duration),
        duration: Number(form.duration),
        maxAttempts: Number(form.maxAttempts),
        passScore: form.passScore ? Number(form.passScore) : null,
        randomizeQuestions: form.shuffleQuestions,
        allowResume: form.allowResume,
        startTime: form.startTime || null,
        endTime: form.endTime || null,
      }
      if (exam) await examApi.update(exam.id, payload)
      else await examApi.create(payload)
      toast.success(exam ? 'Đã cập nhật đề thi' : 'Tạo đề thi thành công')
      onSaved(); onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={exam ? 'Sửa đề thi' : 'Tạo đề thi mới'} onClose={onClose} wide>
      {error && (
        <div className="mx-7 mt-4 px-4 py-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="p-7 space-y-5">
        {/* Tên đề thi */}
        <div>
          <label className="input-label">Tên đề thi <span className="text-danger">*</span></label>
          <input className="input-field" placeholder="Kiểm tra giữa kỳ..." value={form.title}
            onChange={f('title')} required autoFocus />
        </div>

        {/* Mô tả */}
        <div>
          <label className="input-label">Mô tả</label>
          <textarea className="input-field resize-none" rows={2} placeholder="Ghi chú cho sinh viên..."
            value={form.description} onChange={f('description')} />
        </div>

        {/* Lớp học */}
        <div>
          <label className="input-label">Lớp học <span className="text-danger">*</span></label>
          <select className="input-field" value={form.courseId} onChange={f('courseId')} required>
            <option value="">-- Chọn lớp --</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Thời gian làm bài + Số lần thi */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="input-label">Thời gian (phút) <span className="text-danger">*</span></label>
            <input className="input-field" type="number" min={1} max={300}
              value={form.duration} onChange={f('duration')} required />
          </div>
          <div>
            <label className="input-label">Số lần thi tối đa</label>
            <input className="input-field" type="number" min={1} max={10}
              value={form.maxAttempts} onChange={f('maxAttempts')} />
          </div>
        </div>

        {/* Điểm qua môn */}
        <div>
          <label className="input-label">Điểm qua môn
            <span className="ml-1 text-xs" style={{color:'var(--text-3)'}}>
              (để trống nếu không giới hạn)
            </span>
          </label>
          <input className="input-field" type="number" min={0} max={100} step={0.1}
            placeholder="Ví dụ: 5" value={form.passScore} onChange={f('passScore')} />
        </div>

        {/* Thời gian mở / đóng */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <DateTimePicker label="Mở thi từ" value={form.startTime} onChange={f('startTime')} />
          </div>
          <div>
          <DateTimePicker label="Đóng thi lúc" value={form.endTime} onChange={f('endTime')} />
          </div>
        </div>

        {/* Tùy chọn */}
        <div className="flex flex-col gap-3 pt-1">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div onClick={fb('shuffleQuestions')}
              className={`w-9 h-5 rounded-full transition-colors relative ${form.shuffleQuestions ? 'bg-accent' : 'bg-[var(--border-base)]'}`}>
              <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${form.shuffleQuestions ? 'left-4.5' : 'left-0.5'}`}/>
            </div>
            <span className="text-sm text-[var(--text-2)] group-hover:text-[var(--text-1)] transition-colors">Xáo trộn thứ tự câu hỏi</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <div onClick={fb('showResult')}
              className={`w-9 h-5 rounded-full transition-colors relative ${form.showResult ? 'bg-accent' : 'bg-[var(--border-base)]'}`}>
              <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${form.showResult ? 'left-4.5' : 'left-0.5'}`}/>
            </div>
            <span className="text-sm text-[var(--text-2)] group-hover:text-[var(--text-1)] transition-colors">Hiển thị kết quả sau khi nộp</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <div onClick={fb('allowResume')}
              className={`w-9 h-5 rounded-full transition-colors relative ${form.allowResume ? 'bg-accent' : 'bg-[var(--border-base)]'}`}>
              <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${form.allowResume ? 'left-4.5' : 'left-0.5'}`}/>
            </div>
            <span className="text-sm text-[var(--text-2)] group-hover:text-[var(--text-1)] transition-colors">
              Lưu tiến trình khi thoát giữa chừng
              <span className="ml-1 text-xs" style={{color:'var(--text-3)'}}>
                {form.allowResume ? '(timer + câu trả lời + vi phạm được giữ lại)' : '(thoát ra → reset tất cả từ đầu)'}
              </span>
            </span>
          </label>
        </div>

        <div className="flex gap-3 px-7 py-4 border-t border-[var(--border-base)]">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Đang lưu...' : exam ? 'Lưu thay đổi' : 'Tạo đề thi'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Hủy</button>
        </div>
      </form>
    </Modal>
  )
}
