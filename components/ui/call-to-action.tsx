"use client"

import { MoveRight, PhoneCall } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type CTAProps = {
  badge?: string
  title?: string
  description?: string
  primaryLabel?: string
  secondaryLabel?: string
  onPrimaryClick?: () => void
  onSecondaryClick?: () => void
}

function CTA({
  badge = "Get started",
  title = "Try our platform today!",
  description = "Managing a small business today is already tough. Avoid further complications by ditching outdated, tedious trade methods. Our goal is to streamline SMB trade, making it easier and faster than ever.",
  primaryLabel = "Sign up here",
  secondaryLabel = "Jump on a call",
  onPrimaryClick,
  onSecondaryClick,
}: CTAProps) {
  return (
    <div className="w-full py-20 lg:py-40">
      <div className="container mx-auto">
        <div className="flex flex-col text-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 lg:p-14 gap-8 items-center">
          <div>
            <Badge className="border-emerald-500/30 bg-emerald-500/20 text-emerald-100">{badge}</Badge>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-3xl md:text-5xl tracking-tighter max-w-2xl font-semibold">{title}</h3>
            <p className="text-lg leading-relaxed tracking-tight text-gray-300 max-w-2xl">{description}</p>
          </div>
          <div className="flex flex-row gap-4">
            <Button className="gap-3 border-emerald-500/40 bg-transparent" variant="outline" onClick={onSecondaryClick}>
              {secondaryLabel} <PhoneCall className="w-4 h-4" />
            </Button>
            <Button className="gap-3 bg-emerald-500 text-emerald-50 hover:bg-emerald-500/90" onClick={onPrimaryClick}>
              {primaryLabel} <MoveRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export { CTA }
