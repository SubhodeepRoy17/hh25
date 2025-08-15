"use client"

import { useEffect, useRef, useState } from "react"
import { X, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function QrScannerModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [scanResult, setScanResult] = useState<"success" | "error" | null>(null)
  const [scanMessage, setScanMessage] = useState("")

  useEffect(() => {
    async function start() {
      if (!open) return
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch (e) {
        console.warn("Camera not available", e)
        setScanResult("error")
        setScanMessage("Camera access denied or not available")
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

  const simulateSuccessfulScan = () => {
    setScanResult("success")
    setScanMessage("Pickup verified! 15 tokens earned.")
    setTimeout(() => {
      onOpenChange(false)
      setScanResult(null)
      setScanMessage("")
    }, 2000)
  }

  const simulateFailedScan = () => {
    setScanResult("error")
    setScanMessage("Invalid QR code. Please try again.")
    setTimeout(() => {
      setScanResult(null)
      setScanMessage("")
    }, 2000)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-700 bg-zinc-900 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Scan Pickup QR Code</h3>
          <button aria-label="Close" className="p-1 rounded hover:bg-white/10" onClick={() => onOpenChange(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {scanResult ? (
          <div className="text-center py-8">
            {scanResult === "success" ? (
              <div className="space-y-4">
                <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto" />
                <div>
                  <h4 className="text-lg font-semibold text-emerald-100">Success!</h4>
                  <p className="text-gray-300">{scanMessage}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <AlertCircle className="h-16 w-16 text-red-400 mx-auto" />
                <div>
                  <h4 className="text-lg font-semibold text-red-100">Scan Failed</h4>
                  <p className="text-gray-300">{scanMessage}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="rounded-lg overflow-hidden bg-black aspect-video mb-4">
              <video ref={videoRef} className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-emerald-400 rounded-lg">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-300 text-center mb-4">
              Point your camera at the pickup QR code to verify collection
            </p>

            <div className="flex gap-2">
              <Button
                onClick={simulateSuccessfulScan}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Simulate Success
              </Button>
              <Button
                onClick={simulateFailedScan}
                variant="outline"
                className="flex-1 border-red-500/40 bg-transparent text-red-100 hover:bg-red-500/10"
              >
                Simulate Error
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
