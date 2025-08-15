"use client"

import { useEffect, useRef } from "react"
import { X } from "lucide-react"

export default function QrScannerModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    async function start() {
      if (!open) return
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch (e) {
        console.warn("Camera not available", e)
      }
    }
    start()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-700 bg-zinc-900 text-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Scan staff QR</h3>
          <button aria-label="Close" className="p-1 rounded hover:bg-white/10" onClick={() => onOpenChange(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="rounded-lg overflow-hidden bg-black aspect-video">
          <video ref={videoRef} className="h-full w-full object-cover" />
        </div>
        <p className="mt-3 text-sm text-gray-300">Point your camera at the staff QR code to verify.</p>
        <div className="mt-4 flex gap-2">
          <button
            className="flex-1 rounded-md border border-emerald-500/40 bg-emerald-500/20 px-3 py-2 text-emerald-100 hover:bg-emerald-500/30"
            onClick={() => {
              // Simulate successful scan
              alert("QR verified")
              onOpenChange(false)
            }}
          >
            Simulate scan success
          </button>
          <button
            className="flex-1 rounded-md border border-gray-700 px-3 py-2 text-gray-200 hover:bg-white/10"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
