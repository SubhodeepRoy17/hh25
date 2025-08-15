"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

export default function PasswordStrength({ password }: { password: string }) {
  const score = useMemo(() => {
    let s = 0
    if (password.length >= 8) s++
    if (/[A-Z]/.test(password)) s++
    if (/[a-z]/.test(password)) s++
    if (/\d/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    // normalize to 0..4
    return Math.min(4, s)
  }, [password])

  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"]
  const colors = ["#ef4444", "#f59e0b", "#fbbf24", "#10b981", "#059669"]

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn("h-1.5 flex-1 rounded-full bg-zinc-200")}
            style={{ backgroundColor: i < score ? colors[Math.max(1, score)] : undefined }}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-zinc-600">{labels[score]}</p>
    </div>
  )
}
