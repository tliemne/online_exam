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
      const userData = res.data.data
      console.log('🔍 /users/me response:', JSON.stringify(userData))
      setUser(userData)
    } catch (err) {
      console.error('❌ /users/me failed:', err.response?.status, err.response?.data)
      // Chỉ clear token khi 401, không clear khi lỗi server 500
      if (err.response?.status === 401) {
        localStorage.clear()
      }
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
    const userData = me.data.data
    console.log('✅ Login success, user:', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try { if (refreshToken) await authApi.logout(refreshToken) } catch {}
    localStorage.clear()
    setUser(null)
  }

  // Hỗ trợ cả 2 dạng roles: ["ADMIN"] và [{name:"ADMIN"}]
  const hasRole = (role) => {
    if (!user?.roles) return false
    return user.roles.some((r) => (typeof r === 'string' ? r : r.name) === role)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
