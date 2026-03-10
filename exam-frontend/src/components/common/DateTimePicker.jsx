/**
 * DateTimePicker — wrapper nhỏ quanh <input type="datetime-local">
 * Hiển thị lịch native của browser nhưng có style đẹp + icon lịch rõ ràng.
 * Props: value, onChange, label, required, min, max, placeholder
 */
export default function DateTimePicker({ value, onChange, label, required, min, max, id }) {
  const inputId = id || `dtp-${Math.random().toString(36).slice(2, 7)}`

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}{required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {/* Icon lịch — click vào cũng mở picker */}
        <label htmlFor={inputId}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted cursor-pointer
                     hover:text-text-secondary transition-colors z-10 pointer-events-auto">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M6.75 3v1.5M13.25 3v1.5M3 7.5h14M4.5 4.5h11A1.5 1.5 0 0117 6v10.5A1.5 1.5 0 0115.5 18h-11A1.5 1.5 0 013 16.5V6A1.5 1.5 0 014.5 4.5z"/>
          </svg>
        </label>

        <input
          id={inputId}
          type="datetime-local"
          value={value || ''}
          onChange={onChange}
          min={min}
          max={max}
          required={required}
          style={{ colorScheme: 'dark' }}
          className="input-field pl-9 cursor-pointer
            [&::-webkit-calendar-picker-indicator]:opacity-0
            [&::-webkit-calendar-picker-indicator]:absolute
            [&::-webkit-calendar-picker-indicator]:inset-0
            [&::-webkit-calendar-picker-indicator]:w-full
            [&::-webkit-calendar-picker-indicator]:h-full
            [&::-webkit-calendar-picker-indicator]:cursor-pointer"
        />
      </div>
    </div>
  )
}
