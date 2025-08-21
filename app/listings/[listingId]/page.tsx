// app/listings/[listingId]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Users, Package, Star, Mail, Phone, ArrowLeft, Loader2, AlertCircle, Building, Info } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/useAuth"
import Image from "next/image"

interface FoodListing {
  _id: string
  title: string
  description?: string
  donor: {
    name: string
    email: string
    phone: string
    orgName: string
    orgType?: string
    campusEmail?: string
  }
  distance: number
  quantity: number
  unit: string
  types: string[]
  freshness: string
  availableUntil: Date
  location: {
    address: string
    coordinates: {
      lat: number
      lng: number
    }
  }
  images: string[]
  interestedUsers?: number
  createdAt: Date
  instructions?: string
  allowPartial: boolean
  requireInsulated: boolean
}

export default function ListingDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  
  const [listing, setListing] = useState<FoodListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem('authToken')
        if (!token) {
          throw new Error('Authentication required')
        }

        const response = await fetch(`/api/listings/${params.listingId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Listing not found')
          }
          throw new Error('Failed to fetch listing details')
        }

        const data = await response.json()
        setListing(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listing')
      } finally {
        setLoading(false)
      }
    }

    if (params.listingId) {
      fetchListing()
    }
  }, [params.listingId])

  const handleClaim = async () => {
    if (!listing) return
    
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`/api/listings/${listing._id}/claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to claim listing')
      }

      // Redirect to success page with QR code
      router.push(`/dashboard/receiver/claim-success?listingId=${listing._id}`)

      // Show success toast
      toast({
        title: "Success",
        description: "Food claimed successfully! Redirecting to QR code...",
        variant: "default"
      })

    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to claim food',
        variant: "destructive"
      })
    }
  }

  const getFoodTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string, color: string }> = {
      cooked: { label: 'Cooked', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
      produce: { label: 'Produce', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
      bakery: { label: 'Bakery', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
      packaged: { label: 'Packaged', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
      beverages: { label: 'Beverages', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
      mixed: { label: 'Mixed', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
      vegetarian: { label: 'Vegetarian', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
      vegan: { label: 'Vegan', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    }
    
    return (
      <Badge className={`text-xs ${typeMap[type]?.color || 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
        {typeMap[type]?.label || type}
      </Badge>
    )
  }

  const getOrgTypeLabel = (orgType?: string) => {
    const typeMap: Record<string, string> = {
      canteen: 'Canteen',
      event: 'Event Organizer'
    }
    return orgType ? typeMap[orgType] || orgType : 'Individual'
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        </div>
      </main>
    )
  }

  if (error || !listing) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 text-red-200">
            <AlertCircle className="h-5 w-5 inline mr-2" />
            {error || 'Listing not found'}
            <Button
              onClick={() => router.back()}
              className="mt-2 bg-transparent border-red-500/40 text-red-100 hover:bg-red-500/10"
              size="sm"
            >
              Go Back
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-6">
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="mb-6 border-emerald-500/40 bg-transparent text-emerald-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Listings
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Food Images and Details */}
          <div>
            {listing.images && listing.images.length > 0 ? (
              <div className="rounded-lg overflow-hidden mb-6">
                <Image
                  src={listing.images[0]}
                  alt={listing.title}
                  width={600}
                  height={400}
                  className="w-full h-64 object-cover"
                />
              </div>
            ) : (
              <div className="rounded-lg bg-gray-800 h-64 flex items-center justify-center mb-6">
                <Package className="h-16 w-16 text-gray-500" />
              </div>
            )}

            <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Food Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white text-lg mb-2">{listing.title}</h3>
                  {listing.description && (
                    <p className="text-gray-300 mb-4">{listing.description}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {listing.types.map((type) => getFoodTypeBadge(type))}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-emerald-300" />
                    <span>
                      {listing.quantity} {listing.unit}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-300" />
                    <span>Until {new Date(listing.availableUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-300" />
                    <span>{listing.interestedUsers || 0} interested</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-300" />
                    <span>{listing.distance?.toFixed(1) || 'Unknown'}km away</span>
                  </div>
                </div>

                {listing.instructions && (
                  <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4 text-blue-300" />
                      <span className="text-blue-200 font-medium">Special Instructions</span>
                    </div>
                    <p className="text-blue-100 text-sm">{listing.instructions}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span>{listing.location.address}</span>
                </div>

                <div className="flex gap-2 text-sm text-gray-400">
                  <span className="font-medium">Partial claims:</span>
                  <span>{listing.allowPartial ? 'Allowed' : 'Not allowed'}</span>
                </div>

                <div className="flex gap-2 text-sm text-gray-400">
                  <span className="font-medium">Insulated container required:</span>
                  <span>{listing.requireInsulated ? 'Yes' : 'No'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Donor Information and Actions */}
          <div>
            <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800 mb-6">
              <CardHeader>
                <CardTitle className="text-white">Donor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-emerald-300 font-semibold">
                      {listing.donor.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{listing.donor.name}</h3>
                    {listing.donor.orgName && (
                      <div className="flex items-center gap-1 text-sm text-gray-300">
                        <Building className="h-3 w-3" />
                        <span>{listing.donor.orgName}</span>
                        <span className="text-gray-500">•</span>
                        <span>{getOrgTypeLabel(listing.donor.orgType)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-emerald-300" />
                    <span className="text-gray-300">{listing.donor.email}</span>
                  </div>
                  {listing.donor.campusEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-emerald-300" />
                      <span className="text-gray-300">{listing.donor.campusEmail}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-emerald-300" />
                    <span className="text-gray-300">{listing.donor.phone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleClaim}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg"
              size="lg"
            >
              Claim This Food
            </Button>

            <div className="mt-4 text-sm text-gray-400 text-center">
              <p>By claiming this food, you agree to pick it up before the available time.</p>
              {listing.requireInsulated && (
                <p className="text-yellow-300 mt-2">
                  Please bring an insulated container for transport.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}