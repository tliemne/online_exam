import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi, userApi } from '../api/services'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) { setLoading(false); return }
    try {
      const res = await userApi.me()
      setUser(res.data.data)
    } catch {
      localStorage.clear()
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const login = async (username, password) => {
    const res = await authApi.login({ username, password })
    const { accessToken, refreshToken } = res.data.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    const me = await userApi.me()
    setUser(me.data.data)
    return me.data.data
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try { if (refreshToken) await authApi.logout(refreshToken) } catch {}
    localStorage.clear()
    setUser(null)
  }

  const hasRole = (role) => user?.roles?.some((r) => r.name === role)
  const isAdmin = () => hasRole('ADMIN')
  const isTeacher = () => hasRole('TEACHER')
  const isStudent = () => hasRole('STUDENT')

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, isAdmin, isTeacher, isStudent, reload: loadUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
