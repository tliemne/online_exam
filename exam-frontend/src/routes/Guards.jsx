import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  console.log('ProtectedRoute', { user, roles, userRoles: user?.roles })

  if (loading) return <div>Loading...</div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (roles && !roles.some(r => (user.roles || []).includes(r))) {
    return <Navigate to="/unauthorized" replace />
  }
  return children
}

export function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) {
    const roles = user.roles || []
    if (roles.includes('ADMIN')) return <Navigate to="/admin" replace />
    if (roles.includes('TEACHER')) return <Navigate to="/teacher" replace />
    return <Navigate to="/student" replace />
  }
  return children
}