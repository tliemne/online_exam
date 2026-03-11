// Placeholder pages for modules pending backend implementation

function ComingSoon({ title, desc, icon }) {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">{title}</h1>
        <p className="text-[var(--text-2)] text-sm mt-1">{desc}</p>
      </div>
      <div className="card text-center py-16">
        <div className="text-5xl mb-4">{icon}</div>
        <h2 className="font-display font-semibold text-[var(--text-1)] text-xl mb-2">Đang phát triển</h2>
        <p className="text-[var(--text-2)] text-sm max-w-md mx-auto">
          Module này đang được xây dựng ở backend. UI đã sẵn sàng và sẽ được kết nối API khi backend hoàn thiện.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-accent/10 border border-amber-accent/20 text-amber-accent text-sm font-mono">
          <div className="w-2 h-2 rounded-full bg-amber-accent animate-pulse-slow"/>
          Đang phát triển...
        </div>
      </div>
    </div>
  )
}

export function QuestionsPage() {
  return <ComingSoon title="Ngân hàng câu hỏi" desc="Quản lý tất cả câu hỏi trắc nghiệm và tự luận" icon="❓" />
}

export function TeacherExamsPage() {
  return <ComingSoon title="Quản lý đề thi" desc="Tạo, chỉnh sửa và publish đề thi" icon="📝" />
}

export function StudentExamsPage() {
  return <ComingSoon title="Đề thi" desc="Danh sách đề thi dành cho bạn" icon="📋" />
}

export function StudentResultsPage() {
  return <ComingSoon title="Kết quả thi" desc="Lịch sử và điểm số các bài thi" icon="📊" />
}

export function AdminCoursesPage() {
  return <ComingSoon title="Quản lý Courses" desc="Xem toàn bộ lớp học trong hệ thống" icon="🏫" />
}

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="font-display font-bold text-2xl text-[var(--text-1)] mb-2">Không có quyền truy cập</h1>
        <p className="text-[var(--text-2)] text-sm mb-6">Bạn không có quyền truy cập trang này.</p>
        <a href="/" className="btn-primary">Về trang chủ</a>
      </div>
    </div>
  )
}
