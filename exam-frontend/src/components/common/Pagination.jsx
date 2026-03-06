// src/components/common/Pagination.jsx
// Component phân trang dùng chung cho toàn app

export default function Pagination({ page, totalPages, totalElements, size, onPageChange }) {
  if (totalPages <= 1) return null

  const from = page * size + 1
  const to   = Math.min((page + 1) * size, totalElements)

  // Tạo danh sách page numbers hiển thị
  const getPages = () => {
    const pages = []
    const delta = 2  // số trang hiện mỗi bên
    const left  = Math.max(0, page - delta)
    const right = Math.min(totalPages - 1, page + delta)

    if (left > 0) {
      pages.push(0)
      if (left > 1) pages.push('...')
    }
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < totalPages - 1) {
      if (right < totalPages - 2) pages.push('...')
      pages.push(totalPages - 1)
    }
    return pages
  }

  return (
    <div className="flex items-center justify-between mt-4">
      {/* Info */}
      <p className="text-xs text-text-muted font-mono">
        {from}–{to} / {totalElements} kết quả
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted border border-surface-600 bg-surface-700 hover:border-surface-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm">
          ←
        </button>

        {/* Page numbers */}
        {getPages().map((p, i) =>
          p === '...' ? (
            <span key={`dot-${i}`} className="w-8 h-8 flex items-center justify-center text-text-muted text-xs">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-mono font-medium transition-all ${
                p === page
                  ? 'bg-accent text-white border border-accent'
                  : 'text-text-muted border border-surface-600 bg-surface-700 hover:border-surface-500'
              }`}>
              {p + 1}
            </button>
          )
        )}

        {/* Next */}
        <button
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted border border-surface-600 bg-surface-700 hover:border-surface-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm">
          →
        </button>
      </div>
    </div>
  )
}
