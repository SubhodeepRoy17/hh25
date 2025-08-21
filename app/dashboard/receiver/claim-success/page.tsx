//app/dashboard/receiver/claim-success/page.tsx
"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle2, 
  Download, 
  ArrowLeft, 
  Copy,
  Clock,
  MapPin,
  Package,
  Utensils
} from "lucide-react"
import QRCode from "@/components/ui/qr-code"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface ClaimDetails {
  listingId: string
  qrCode: string
  title: string
  quantity: number
  unit: string
  availableUntil: string
  location: string
  donorName: string
  claimedAt: string
  expiresAt: string
}

// Main component that uses useSearchParams
function ClaimSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [claimDetails, setClaimDetails] = useState<ClaimDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const listingId = searchParams.get('listingId')
    if (!listingId) {
      router.push('/dashboard/receiver')
      return
    }

    // Fetch claim details from API
    const fetchClaimDetails = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) {
          throw new Error('Authentication required')
        }

        const response = await fetch(`/api/listings/${listingId}/claim-details`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch claim details')
        }

        const data = await response.json()
        setClaimDetails(data)
      } catch (error) {
        console.error('Error fetching claim details:', error)
        toast({
          title: "Error",
          description: "Failed to load claim details",
          variant: "destructive"
        })
        router.push('/dashboard/receiver')
      } finally {
        setLoading(false)
      }
    }

    fetchClaimDetails()
  }, [searchParams, router, toast])

  const handleDownloadQR = () => {
    if (!claimDetails) return

    const canvas = document.querySelector('canvas')
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `food-rescue-qr-${claimDetails.listingId}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const handleCopyQRCode = () => {
    if (!claimDetails) return

    navigator.clipboard.writeText(claimDetails.qrCode)
    toast({
      title: "Copied!",
      description: "QR code text copied to clipboard",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (!claimDetails) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Claim Not Found</h1>
          <Button onClick={() => router.push('/dashboard/receiver')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/receiver')}
            className="border-emerald-500/40 bg-transparent text-emerald-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Claim Successful!</h1>
            <p className="text-gray-300">Your food reservation has been confirmed</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - QR Code */}
          <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                Pickup QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="inline-block p-4 bg-white rounded-lg">
                  <QRCode 
                    value={claimDetails.qrCode} 
                    size={200}
                    className="mx-auto"
                  />
                </div>
                <p className="text-sm text-gray-400 mt-4">
                  Show this QR code to the donor when picking up the food
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleDownloadQR}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download QR
                </Button>
                <Button
                  onClick={handleCopyQRCode}
                  variant="outline"
                  className="border-emerald-500/40 bg-transparent text-emerald-100"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-300 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-semibold">Expires</span>
                </div>
                <p className="text-sm text-yellow-200">
                  This QR code expires on {new Date(claimDetails.expiresAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Claim Details */}
          <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800">
            <CardHeader>
              <CardTitle>Claim Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">{claimDetails.title}</h3>
                <p className="text-emerald-300">From {claimDetails.donorName}</p>
              </div>

              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-emerald-400" />
                  <div>
                    <p className="font-medium">Quantity</p>
                    <p className="text-gray-300">
                      {claimDetails.quantity} {claimDetails.unit}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-emerald-400" />
                  <div>
                    <p className="font-medium">Pickup Before</p>
                    <p className="text-gray-300">
                      {new Date(claimDetails.availableUntil).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-emerald-400" />
                  <div>
                    <p className="font-medium">Pickup Location</p>
                    <p className="text-gray-300">{claimDetails.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Utensils className="h-5 w-5 text-emerald-400" />
                  <div>
                    <p className="font-medium">Claimed At</p>
                    <p className="text-gray-300">
                      {new Date(claimDetails.claimedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-300 mb-2">Pickup Instructions</h4>
                <ul className="text-sm text-emerald-200 space-y-1">
                  <li>• Show the QR code to the donor upon arrival</li>
                  <li>• Bring your own containers if possible</li>
                  <li>• Arrive during the specified pickup window</li>
                  <li>• Be respectful of the donor's time and property</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Loading component for Suspense fallback
function ClaimSuccessLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
    </div>
  )
}

// Main page component with Suspense boundary
export default function ClaimSuccessPage() {
  return (
    <Suspense fallback={<ClaimSuccessLoading />}>
      <ClaimSuccessContent />
    </Suspense>
  )
}