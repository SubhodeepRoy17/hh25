// app/auth/login/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

type Role = 'donor' | 'receiver'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('donor')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { isLoading: authLoading, login } = useAuth()

  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email)

  function validate() {
    const e: Record<string, string> = {}
    if (!validateEmail(email)) e.email = 'Enter a valid email.'
    if (password.length < 6) e.password = 'Password must be at least 6 characters.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')

      if (data.role !== role) {
        throw new Error(`Please login as a ${data.role}`)
      }

      // call context login — it will set state + redirect
      await login(data.token, {
        userId: data.userId,
        role: data.role,
        email: data.email,
        ...(data.orgName && { orgName: data.orgName }),
        ...(data.fullName && { fullName: data.fullName }),
        ...(data.orgType && { orgType: data.orgType }),
        ...(data.isNgo !== undefined && { isNgo: data.isNgo })
      })

      // NO extra router.replace here; AuthProvider.login handles redirect.
    } catch (err: any) {
      toast.error(err?.message || 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(1200px_600px_at_10%_10%,rgba(16,185,129,0.08),transparent_60%),#0a0a0f] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[28px] bg-white text-zinc-900 shadow-2xl p-8 md:p-10">
        <div className="mb-6">
          <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700">Welcome back</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Login</h1>
        <p className="text-zinc-600 mb-8">Access your Smart Surplus account.</p>

        <div className="flex items-center gap-2 mb-6">
          <Segmented
            options={[
              { key: 'donor', label: 'Donor' },
              { key: 'receiver', label: 'Receiver' },
            ]}
            value={role}
            onChange={(v) => setRole(v as Role)}
            green="#2ECC71"
          />
        </div>

        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder={role === 'donor' ? 'canteen@university.edu' : 'example@gmail.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(errors.email && 'border-red-500')}
            />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/auth/forgot-password" className="text-sm text-emerald-700 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(errors.password && 'border-red-500 pr-10')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
          </div>

          <Button
            type="submit"
            className="w-full h-11 font-semibold"
            disabled={isSubmitting}
            style={{ backgroundColor: '#2ECC71', color: '#0b1411' }}
          >
            {isSubmitting ? 'Logging in...' : 'Log in'}
          </Button>
        </form>

        <p className="mt-6 text-sm text-zinc-600 text-center">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-emerald-700 hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

function Segmented({
  options,
  value,
  onChange,
  green,
}: {
  options: { key: string; label: string }[]
  value: string
  onChange: (val: string) => void
  green: string
}) {
  return (
    <div className="inline-flex rounded-full border border-zinc-200 bg-white p-1 shadow-inner">
      {options.map((opt) => {
        const active = value === opt.key
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={cn(
              'px-3 py-1 rounded-full transition-colors text-sm',
              active ? 'text-black' : 'text-zinc-600'
            )}
            style={{
              backgroundColor: active ? '#E7FFF1' : 'transparent',
              border: active ? `1px solid ${green}` : '1px solid transparent',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
