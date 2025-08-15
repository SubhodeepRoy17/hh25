// components/auth/ProtectedRoute.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { usePathname, useRouter } from 'next/navigation'

export default function ProtectedRoute({
  children,
  requiredRole
}: {
  children: React.ReactNode
  requiredRole?: 'donor' | 'receiver'
}) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // wait for auth to finish loading; don't redirect while loading
    if (isLoading) return

    // not authenticated -> save redirect (unless on auth pages) and send to login
    if (!user) {
      if (!pathname.startsWith('/auth')) {
        sessionStorage.setItem('redirectUrl', pathname)
      }
      router.replace('/auth/login')
      return
    }

    // if role mismatch, send to the user's default dashboard
    if (requiredRole && user.role !== requiredRole) {
      const defaultRoute = user.role === 'donor' ? '/dashboard/donor' : '/dashboard/receiver'
      router.replace(defaultRoute)
      return
    }

    setChecked(true)
  }, [user, isLoading, requiredRole, router, pathname])

  // show loader while checking auth
  if (isLoading || !checked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-emerald-500 rounded-full" />
      </div>
    )
  }

  return <>{children}</>
}
