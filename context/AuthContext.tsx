// context/AuthContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export interface User {
  userId: string
  role: 'donor' | 'receiver'
  email?: string
  orgName?: string
  fullName?: string
  orgType?: string
  isNgo?: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (token: string, userData: User) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // initialize from localStorage synchronously if possible to avoid flicker
  const [user, setUser] = useState<User | null>(() => {
    try {
      if (typeof window === 'undefined') return null
      const raw = localStorage.getItem('userData')
      return raw ? JSON.parse(raw) as User : null
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const router = useRouter()

  // ensure token/user are validated/loaded on mount
  useEffect(() => {
    const init = async () => {
      try {
        // If token exists, keep user (we already read synchronously above)
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
        if (!token) {
          // no token -> ensure clean state
          setUser(null)
        } else {
          // optional: could refresh token / revalidate with /api/auth/me here
          // but we keep user from localStorage to avoid redirect flicker
          // if you want validation, do it here and update setUser accordingly
        }
      } catch (err) {
        console.error('Auth init error', err)
        setUser(null)
        localStorage.removeItem('authToken')
        localStorage.removeItem('userData')
      } finally {
        setIsLoading(false)
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(async (token: string, userData: User) => {
    try {
      // persist
      localStorage.setItem('authToken', token)
      localStorage.setItem('userData', JSON.stringify(userData))

      // update immediate state to avoid ProtectedRoute flicker
      setUser(userData)
      setIsLoading(false)

      // redirect path handling (preserve saved redirect if any)
      const redirectPath =
        sessionStorage.getItem('redirectUrl') ||
        (userData.role === 'donor' ? '/dashboard/donor' : '/dashboard/receiver')
      sessionStorage.removeItem('redirectUrl')

      // prefer SPA navigation; router.replace is fine because user state is already set
      router.replace(redirectPath)
    } catch (err) {
      console.error('login error', err)
      throw err
    }
  }, [router])

  const logout = useCallback(() => {
    // clear storage and state
    localStorage.removeItem('authToken')
    localStorage.removeItem('userData')
    sessionStorage.removeItem('redirectUrl')
    setUser(null)
    // fully navigate to login (replace to avoid back navigation preserving state)
    router.replace('/auth/login')
  }, [router])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
