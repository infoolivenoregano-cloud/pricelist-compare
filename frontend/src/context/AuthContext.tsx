import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api'

interface User {
  id: number
  name: string
  email: string
  restaurant_name: string | null
  role: string
}

interface AuthCtx {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string, restaurant_name?: string) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('oo_token'))

  useEffect(() => {
    if (token && !user) {
      fetch(`${BASE}/auth/me?token=${token}`)
        .then(r => r.ok ? r.json() : null)
        .then(u => { if (u) setUser(u); else { setToken(null); localStorage.removeItem('oo_token') } })
    }
  }, [])

  async function login(email: string, password: string) {
    const r = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!r.ok) {
      const err = await r.json()
      throw new Error(err.detail ?? 'Login failed')
    }
    const data = await r.json()
    setToken(data.access_token)
    setUser(data.user)
    localStorage.setItem('oo_token', data.access_token)
  }

  async function signup(name: string, email: string, password: string, restaurant_name?: string) {
    const r = await fetch(`${BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, restaurant_name }),
    })
    if (!r.ok) {
      const err = await r.json()
      throw new Error(err.detail ?? 'Signup failed')
    }
    const data = await r.json()
    setToken(data.access_token)
    setUser(data.user)
    localStorage.setItem('oo_token', data.access_token)
  }

  function logout() {
    setUser(null)
    setToken(null)
    localStorage.removeItem('oo_token')
  }

  return <Ctx.Provider value={{ user, token, login, signup, logout }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
