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
  Utensils,
  Loader2,
  Heart,
  QrCode,
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
      <div className="min-h-screen bg-gradient-to-br from-background via-card/30 to-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your claim details...</p>
        </div>
      </div>
    )
  }

  if (!claimDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card/30 to-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Claim Not Found</h1>
          <Button
            onClick={() => router.push("/dashboard/receiver")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card/30 to-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/receiver')}
            className="border-primary/30 bg-card hover:bg-primary/10 text-primary font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="h-8 w-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">Claim Successful!</h1>
            </div>
            <p className="text-muted-foreground text-lg">Your food reservation has been confirmed 🎉</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - QR Code */}
          <Card className="bg-gradient-to-br from-primary/5 via-card/80 to-accent/5 backdrop-blur-sm border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <QrCode className="h-6 w-6 text-primary" />
                Your Pickup QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="inline-block p-6 bg-white rounded-2xl shadow-lg">
                  <QRCode 
                    value={claimDetails.qrCode} 
                    size={220}
                    className="mx-auto"
                  />
                </div>
                <p className="text-muted-foreground mt-4 font-medium">
                  Show this QR code to the donor when picking up your food
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleDownloadQR}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download QR Code
                </Button>
                <Button
                  onClick={handleCopyQRCode}
                  variant="outline"
                  className="border-primary/30 bg-background hover:bg-primary/10 text-primary font-medium h-12 px-6"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>

              <div className="bg-accent/10 border border-accent/30 rounded-xl p-4">
                <div className="flex items-center gap-2 text-accent mb-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">Important: QR Code Expires</span>
                </div>
                <p className="text-sm text-accent/80 font-medium">
                  {new Date(claimDetails.expiresAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Claim Details */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Pickup Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
                <h3 className="text-xl font-bold mb-2 text-foreground">{claimDetails.title}</h3>
                <p className="text-primary font-semibold">From {claimDetails.donorName}</p>
              </div>

              <div className="grid gap-4">
                <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Quantity</p>
                    <p className="text-muted-foreground">
                      {claimDetails.quantity} {claimDetails.unit}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Clock className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Pickup Before</p>
                    <p className="text-muted-foreground">{new Date(claimDetails.availableUntil).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Pickup Location</p>
                    <p className="text-muted-foreground">{claimDetails.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Utensils className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Claimed At</p>
                    <p className="text-muted-foreground">{new Date(claimDetails.claimedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Pickup Guidelines
                </h4>
                <ul className="text-sm text-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Show the QR code to the donor upon arrival
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Bring your own containers if possible
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Arrive during the specified pickup window
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Be respectful of the donor's time and property
                  </li>
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
    <div className="min-h-screen bg-gradient-to-br from-background via-card/30 to-background text-foreground flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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