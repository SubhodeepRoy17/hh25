"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Shield, Users } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

type Role = "donor" | "receiver"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<Role>("donor")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { isLoading: authLoading, login } = useAuth()

  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email)

  function validate() {
    const e: Record<string, string> = {}
    if (!validateEmail(email)) e.email = "Enter a valid email."
    if (password.length < 6) e.password = "Password must be at least 6 characters."
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Login failed")

      if (data.role !== role) {
        throw new Error("Please login as a ${data.role}")
      }

      // call context login — it will set state + redirect
      await login(data.token, {
        userId: data.userId,
        role: data.role,
        email: data.email,
        ...(data.orgName && { orgName: data.orgName }),
        ...(data.fullName && { fullName: data.fullName }),
        ...(data.orgType && { orgType: data.orgType }),
        ...(data.isNgo !== undefined && { isNgo: data.isNgo }),
      })

      // NO extra router.replace here; AuthProvider.login handles redirect.
    } catch (err: any) {
      toast.error(err?.message || "Login failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
          <p className="text-muted-foreground">Sign in to your Smart Surplus account</p>
        </div>

        {/* Main Card */}
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
          {/* Role Selection */}
          <div className="mb-6">
            <Label className="text-sm font-medium text-foreground mb-3 block">Account Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("donor")}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
                  role === "donor"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50",
                )}
              >
                <Users className="w-4 h-4" />
                <span className="font-medium">Donor</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("receiver")}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
                  role === "receiver"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50",
                )}
              >
                <Shield className="w-4 h-4" />
                <span className="font-medium">Receiver</span>
              </button>
            </div>
          </div>

          <form className="space-y-5" onSubmit={onSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={role === "donor" ? "canteen@university.edu" : "example@gmail.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(
                  "h-12 bg-input border-border focus:border-primary focus:ring-ring",
                  errors.email && "border-destructive focus:border-destructive",
                )}
              />
              {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "h-12 bg-input border-border focus:border-primary focus:ring-ring pr-12",
                    errors.password && "border-destructive focus:border-destructive",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl transition-all duration-200"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-foreground" />
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Create account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}