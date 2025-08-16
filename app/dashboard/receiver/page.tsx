// app/dashboard/receiver/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Users,
  QrCode,
  Bell,
  Leaf,
  Coins,
  Package,
  Star,
  ChevronRight,
  Utensils,
  AlertCircle,
  Timer,
} from "lucide-react"
import { cn } from "@/lib/utils"
import QrScannerModal from "@/components/receiver/qr-scanner-modal"
import { useToast } from "@/components/ui/use-toast"
import { FoodType, Freshness, QuantityUnit } from "@/lib/models/FoodListing"

interface FoodListing {
  _id: string
  title: string
  donor: {
    name: string
    rating?: number
  }
  distance: number
  quantity: number
  unit: QuantityUnit
  types: FoodType[]
  freshness: Freshness
  availableUntil: Date
  location: {
    address: string
    coordinates: {
      lat: number
      lng: number
    }
  }
  images: string[]
  status: 'published' | 'claimed' | 'completed'
  interestedUsers?: number
  tags?: string[]
  createdAt: Date
}

interface ImpactStats {
  tokensEarned: number
  foodClaimed: number
  co2Saved: number
  mealsReceived: number
  rank: string
  nextRankTokens: number
}

export default function ReceiverDashboardPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [vegOnly, setVegOnly] = useState(false)
  const [maxDistance, setMaxDistance] = useState(5)
  const [qrScanOpen, setQrScanOpen] = useState(false)
  const [listings, setListings] = useState<FoodListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [impactStats, setImpactStats] = useState<ImpactStats | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const { toast } = useToast()

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (err) => {
          setLocationError("Unable to retrieve your location. Please enable location services.")
          console.error("Geolocation error:", err)
          // Default to a central location if geolocation fails
          setUserLocation({ lat: 12.9716, lng: 77.5946 }) // Default to Bangalore coordinates
        }
      )
    } else {
      setLocationError("Geolocation is not supported by your browser.")
      setUserLocation({ lat: 12.9716, lng: 77.5946 }) // Default to Bangalore coordinates
    }
  }, [])

  const fetchListings = async () => {
    if (!userLocation) return

    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const params = new URLSearchParams({
        lat: userLocation.lat.toString(),
        lng: userLocation.lng.toString(),
        maxDistance: maxDistance.toString(),
        vegOnly: vegOnly.toString(),
        query: searchQuery
      })

      const response = await fetch(`/api/listings/available?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setListings(data.listings || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listings')
      console.error('Error fetching listings:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userLocation) {
      fetchListings()
    }
  }, [userLocation, maxDistance, vegOnly, searchQuery])

  const fetchImpactStats = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      const response = await fetch('/api/receiver/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch impact stats')
      }

      const data = await response.json()
      setImpactStats(data)
    } catch (err) {
      console.error('Error fetching impact stats:', err)
    }
  }

  useEffect(() => {
    fetchImpactStats()
  }, [])

  const handleClaim = async (listingId: string) => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`/api/listings/${listingId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to claim listing`)
      }

      toast({
        title: "Success",
        description: "Food claimed successfully! Check your notifications for pickup details.",
        variant: "success"
      })

      await fetchListings()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to claim food',
        variant: "destructive"
      })
    }
  }

  const handleQrScan = () => {
    setQrScanOpen(true)
  }

  const getFoodTypeBadge = (type: FoodType) => {
    const typeMap = {
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

  if (loading && !listings.length) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-gray-400">Loading food listings...</div>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 text-red-200">
            <AlertCircle className="h-5 w-5 inline mr-2" />
            {error}
            <Button
              onClick={fetchListings}
              className="mt-2 bg-transparent border-red-500/40 text-red-100 hover:bg-red-500/10"
              size="sm"
            >
              Retry
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Food Discovery</h1>
            <p className="text-gray-300 text-sm">Find surplus food near you</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleQrScan}
              className="border-emerald-500/40 bg-transparent text-emerald-100"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Scan QR
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/receiver/notifications")}
              className="border-emerald-500/40 bg-transparent text-emerald-100 relative"
            >
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {locationError && (
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3 mb-6 text-yellow-200">
            <AlertCircle className="h-5 w-5 inline mr-2" />
            {locationError} Showing listings within {maxDistance}km of default location.
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_350px] gap-6">
          {/* Left Column - Food Discovery */}
          <div className="space-y-6">
            {/* Search and Filters */}
            <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800">
              <CardContent className="p-4">
                <div className="flex gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search food listings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="border-emerald-500/40 bg-transparent text-emerald-100"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>

                {showFilters && (
                  <div className="border-t border-gray-800 pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="veg-only">Vegetarian only</Label>
                      <Switch 
                        id="veg-only" 
                        checked={vegOnly} 
                        onCheckedChange={setVegOnly} 
                      />
                    </div>
                    <div>
                      <Label>Max distance: {maxDistance}km</Label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={maxDistance}
                        onChange={(e) => setMaxDistance(Number(e.target.value))}
                        className="w-full mt-2 accent-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Food Listings */}
            <div className="space-y-4">
              {listings.length > 0 ? (
                listings.map((listing) => (
                  <Card
                    key={listing._id}
                    className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800 hover:border-emerald-500/30 transition-colors"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-white text-lg">{listing.title}</h3>
                            {listing.donor.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="text-sm text-gray-300">{listing.donor.rating}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-emerald-300 text-sm font-medium mb-2">{listing.donor.name}</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {listing.types.map((type) => getFoodTypeBadge(type))}
                            {listing.tags?.map((tag) => (
                              <Badge
                                key={tag}
                                className="bg-emerald-500/20 text-emerald-100 border-emerald-500/30 text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">{listing.distance.toFixed(1)}km away</p>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4 mb-4 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-emerald-300" />
                          <span>
                            {listing.quantity} {listing.unit}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-emerald-300" />
                          <span>Until {new Date(listing.availableUntil).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-emerald-300" />
                          <span>{listing.interestedUsers || 0} interested</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
                        <MapPin className="h-4 w-4" />
                        <span>{listing.location.address}</span>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleClaim(listing._id)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Claim Food
                        </Button>
                        <Button variant="outline" className="border-emerald-500/40 bg-transparent text-emerald-100">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800">
                  <CardContent className="p-6 text-center">
                    <Package className="h-10 w-10 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400">No food listings found within {maxDistance}km</p>
                    <Button
                      onClick={() => {
                        setSearchQuery('')
                        setVegOnly(false)
                        setMaxDistance(10)
                      }}
                      className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Right Column - Notifications & Impact */}
          <div className="space-y-6">
            {/* Impact Profile */}
            {impactStats && (
              <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Star className="h-5 w-5 text-emerald-300" />
                    Impact Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-100 border border-yellow-500/30 mb-2">
                      <Star className="h-4 w-4" />
                      {impactStats.rank}
                    </div>
                    <p className="text-sm text-gray-400">{impactStats.nextRankTokens} tokens to next rank</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Coins className="h-4 w-4 text-emerald-300" />
                        <span className="font-bold text-emerald-100">{impactStats.tokensEarned}</span>
                      </div>
                      <p className="text-xs text-gray-400">Tokens Earned</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Package className="h-4 w-4 text-emerald-300" />
                        <span className="font-bold text-emerald-100">{impactStats.foodClaimed}</span>
                      </div>
                      <p className="text-xs text-gray-400">Food Claimed</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Leaf className="h-4 w-4 text-emerald-300" />
                        <span className="font-bold text-emerald-100">{impactStats.co2Saved}t</span>
                      </div>
                      <p className="text-xs text-gray-400">CO₂ Saved</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Utensils className="h-4 w-4 text-emerald-300" />
                        <span className="font-bold text-emerald-100">{impactStats.mealsReceived}</span>
                      </div>
                      <p className="text-xs text-gray-400">Meals Received</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleQrScan}
                  className="w-full justify-start bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <QrCode className="h-4 w-4 mr-3" />
                  Scan Pickup QR
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-emerald-500/40 bg-transparent text-emerald-100"
                  onClick={() => router.push("/dashboard/receiver/notifications")}
                >
                  <Bell className="h-4 w-4 mr-3" />
                  View All Notifications
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <QrScannerModal open={qrScanOpen} onOpenChange={setQrScanOpen} />
    </main>
  )
}