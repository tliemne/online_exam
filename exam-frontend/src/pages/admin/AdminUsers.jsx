import { useState, useEffect } from 'react'
import { userApi } from '../../api/services'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)

  const load = () => {
    setLoading(true)
    userApi.getAll()
      .then((r) => setUsers(r.data.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa người dùng này?')) return
    setDeleting(id)
    try {
      await userApi.delete(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const filtered = users.filter((u) =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Quản lý Users</h1>
          <p className="text-text-secondary text-sm mt-1">{users.length} người dùng trong hệ thống</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input className="input-field pl-9" placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button onClick={load} className="btn-secondary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
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
                  {['ID', 'Họ tên', 'Username', 'Email', 'Vai trò', 'Trạng thái', ''].map((h) => (
                    <th key={h} className="text-left text-xs text-text-muted uppercase tracking-wider pb-3 pr-4 font-mono">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-700/30 transition-colors">
                    <td className="py-3 pr-4 text-xs text-text-muted font-mono">#{u.id}</td>
                    <td className="py-3 pr-4 text-sm text-text-primary font-medium">{u.fullName || '—'}</td>
                    <td className="py-3 pr-4 text-sm text-text-secondary font-mono">{u.username}</td>
                    <td className="py-3 pr-4 text-sm text-text-secondary">{u.email || '—'}</td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-1 flex-wrap">
                        {u.roles?.map((r) => (
                          <span key={r} className={r === 'ADMIN' ? 'badge-red' : r === 'TEACHER' ? 'badge-cyan' : 'badge-green'}>{r}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={u.status === 'ACTIVE' ? 'badge-green' : 'badge-muted'}>{u.status}</span>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={deleting === u.id}
                        className="btn-ghost text-red-accent/70 hover:text-red-accent hover:bg-red-accent/10 px-2 py-1 text-xs">
                        {deleting === u.id ? '...' : 'Xóa'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-8 text-text-muted text-sm">Không tìm thấy kết quả</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
