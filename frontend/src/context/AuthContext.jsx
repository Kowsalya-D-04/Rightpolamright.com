import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

/** Where each role lands after signing in. */
export const HOME_FOR = {
  admin: '/dashboard',
  customer: '/customer/dashboard',
  driver: '/driver/dashboard',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('rpr_user')
    return raw ? JSON.parse(raw) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('rpr_token')
    if (!token) { setLoading(false); return }
    api.get('/auth/me')
      .then(({ data }) => { setUser(data); localStorage.setItem('rpr_user', JSON.stringify(data)) })
      .catch(() => { localStorage.removeItem('rpr_token'); localStorage.removeItem('rpr_user'); setUser(null) })
      .finally(() => setLoading(false))
  }, [])

  const persist = (data) => {
    localStorage.setItem('rpr_token', data.access_token)
    localStorage.setItem('rpr_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  /** role: 'admin' | 'customer' | 'driver' | undefined (any) */
  const login = async (email, password, role) => {
    const path = role ? `/auth/${role}/login` : '/auth/login'
    const { data } = await api.post(path, { email, password })
    return persist(data)
  }

  const registerCustomer = async (payload) => {
    const { data } = await api.post('/auth/customer/register', payload)
    return persist(data)
  }

  const registerDriver = async (payload) => {
    const { data } = await api.post('/auth/driver/register', payload)
    return persist(data)
  }

  const logout = () => {
    localStorage.removeItem('rpr_token')
    localStorage.removeItem('rpr_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, login, logout, loading, registerCustomer, registerDriver }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
