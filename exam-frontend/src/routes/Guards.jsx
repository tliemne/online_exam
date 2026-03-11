import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <p className="text-[var(--text-2)] text-sm font-body">Đang tải...</p>
      </div>
    </div>
  )

  if (!user) {
    console.warn('ProtectedRoute: no user, redirect to login')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles) {
    const userRoles = user.roles || []
    console.log('ProtectedRoute check - required:', roles, '| user roles:', userRoles)
    const hasAccess = roles.some((r) =>
      userRoles.some((ur) => (typeof ur === 'string' ? ur : ur.name) === r)
    )
    if (!hasAccess) {
      console.warn('Access denied - user roles:', userRoles, '| required:', roles)
      return <Navigate to="/unauthorized" replace />
    }
  }

  return children
}

export function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) {
    const roles = user.roles || []
    const getRole = (r) => typeof r === 'string' ? r : r.name
    if (roles.some((r) => getRole(r) === 'ADMIN')) return <Navigate to="/admin" replace />
    if (roles.some((r) => getRole(r) === 'TEACHER')) return <Navigate to="/teacher" replace />
    return <Navigate to="/student" replace />
  }
  return children
}
