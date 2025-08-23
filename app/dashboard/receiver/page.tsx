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
  LogOut,
  Utensils,
  AlertCircle,
  Loader2,
  Heart,
  Award,
  Sparkles,
  ExternalLink,
} from "lucide-react"
import QrScannerModal from "@/components/receiver/qr-scanner-modal"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { connectWallet, claimFoodOnBlockchain } from "@/lib/blockchain"

interface FoodListing {
  _id: string
  title: string
  donor: {
    name: string
    rating?: number
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
  blockchainId?: number
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
  const { user, logout } = useAuth()
  const { toast } = useToast()
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState("")
  const [vegOnly, setVegOnly] = useState(false)
  const [maxDistance, setMaxDistance] = useState(5)
  const [showFilters, setShowFilters] = useState(false)
  
  // State for listings and loading
  const [listings, setListings] = useState<FoodListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // State for impact stats
  const [impactStats, setImpactStats] = useState<ImpactStats | null>(null)
  
  // State for location and QR scanner
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({ 
    lat: 22.5726, // Default to Kolkata coordinates
    lng: 88.3639 
  })
  const [locationError, setLocationError] = useState<string | null>(null)
  const [qrScanOpen, setQrScanOpen] = useState(false)
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [claimingListingId, setClaimingListingId] = useState<string | null>(null)

  // Get user's current location with fallback
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported - using default location")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      (err) => {
        console.error("Geolocation error:", err)
        setLocationError("Using default location - enable location for accurate results")
      },
      { timeout: 5000 }
    )
  }, [])

  // Check wallet connection
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setIsWalletConnected(true);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkWalletConnection();
  }, []);

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      setIsWalletConnected(true);
      toast({
        title: "Wallet Connected",
        description: "Your MetaMask wallet is now connected.",
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Wallet Connection Failed",
        description: "Please install MetaMask or check your connection.",
        variant: "destructive",
      });
    }
  };

  // Fetch listings when filters or location change
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true)
        setError(null)

        // Use token from auth context instead of localStorage
        const token = localStorage.getItem('authToken')
        if (!token) {
          throw new Error('Authentication required - please login again')
        }

        const params = new URLSearchParams({
          lat: userLocation.lat.toString(),
          lng: userLocation.lng.toString(),
          maxDistance: maxDistance.toString(),
          vegOnly: vegOnly.toString(),
          query: searchQuery
        })

        const response = await fetch(`/api/listings/available?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          if (response.status === 401) {
            logout()
            throw new Error('Session expired - please login again')
          }
          throw new Error('Failed to fetch listings')
        }

        const data = await response.json()
        setListings(data.listings || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listings')
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchListings, 500)
    return () => clearTimeout(debounceTimer)
  }, [userLocation, maxDistance, vegOnly, searchQuery, logout])

  // Fetch impact stats
  useEffect(() => {
    const fetchImpactStats = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) return

        const response = await fetch('/api/receiver/stats', {
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

    fetchImpactStats()
  }, [])

  const handleClaim = async (listingId: string, blockchainId?: number) => {
    setClaimingListingId(listingId);
    
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('Authentication required')
      }

      // Connect wallet if not already connected and listing has blockchain ID
      if (blockchainId && !isWalletConnected) {
        try {
          await connectWallet();
          setIsWalletConnected(true);
        } catch (walletError) {
          throw new Error('Please connect your wallet to claim this listing');
        }
      }

      // Update blockchain if listing has a blockchain ID
      if (blockchainId && isWalletConnected) {
        try {
          await claimFoodOnBlockchain(blockchainId);
        } catch (blockchainError) {
          console.error('Blockchain claim failed:', blockchainError);
          throw new Error('Failed to claim on blockchain. Please ensure your wallet is connected.');
        }
      }

      const response = await fetch(`/api/listings/${listingId}/claim`, {
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

      const result = await response.json()
      
      // Redirect to success page with QR code
      router.push(`/dashboard/receiver/claim-success?listingId=${listingId}`)

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
      
      if (err instanceof Error && err.message.includes('Session expired')) {
        logout()
      }
    } finally {
      setClaimingListingId(null);
    }
  }

  const handleQrScan = () => {
    setQrScanOpen(true)
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

  if (loading && !listings.length) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-destructive">
            <AlertCircle className="h-5 w-5 inline mr-2" />
            {error}
            <Button
              onClick={() => window.location.reload()}
              className="mt-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              size="sm"
            >
              Try Again
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Utensils className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">Discover Food Near You</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <p className="text-muted-foreground text-lg">Join our community in reducing food waste</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/receiver/notifications")}
              className="border-accent/30 bg-card hover:bg-accent/10 text-accent font-medium shadow-sm relative"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => {
                localStorage.removeItem('authToken')
                localStorage.removeItem('userData')
                router.push('/auth/login')
              }}
              variant="outline"
              size="sm"
              className="border-destructive/30 bg-destructive/5 hover:bg-destructive/10 text-destructive shadow-sm"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {locationError && (
          <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-8 text-accent-foreground shadow-sm">
            <AlertCircle className="h-5 w-5 inline mr-2" />
            {locationError}
          </div>
        )}

        {/* Wallet Connection Banner */}
        {!isWalletConnected && (
          <div className="mb-8 p-4 bg-accent/10 border border-accent/20 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-accent-foreground">Connect your wallet</h3>
                <p className="text-muted-foreground text-sm">
                  To claim food listings on the blockchain, please connect your MetaMask wallet.
                </p>
              </div>
              <Button
                onClick={handleConnectWallet}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                size="sm"
              >
                Connect Wallet
              </Button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          {/* Left Column - Food Discovery */}
          <div className="space-y-6">
            <Card className="bg-card/90 backdrop-blur-sm border-border/50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Search by food type, donor, or location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-12 text-base bg-input border-border/50 focus:border-primary shadow-sm"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-12 px-6 border-primary/30 bg-card hover:bg-primary/10 text-primary font-medium shadow-sm"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>

                {showFilters && (
                  <div className="border-t border-border/50 pt-6 space-y-6">
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <Label htmlFor="veg-only" className="text-base font-medium text-card-foreground">
                        Vegetarian only
                      </Label>
                      <Switch id="veg-only" checked={vegOnly} onCheckedChange={setVegOnly} />
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <Label className="text-base font-medium text-card-foreground">
                        Max distance: {maxDistance}km
                      </Label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={maxDistance}
                        onChange={(e) => setMaxDistance(Number(e.target.value))}
                        className="w-full mt-3 accent-primary"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span>1km</span>
                        <span>20km</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              {listings.length > 0 ? (
                listings.map((listing) => (
                  <Card
                    key={listing._id}
                    className="bg-card/90 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300 group"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-bold text-card-foreground text-xl">{listing.title}</h3>
                              {listing.donor.rating && (
                                <div className="flex items-center gap-1 bg-accent/10 px-2 py-1 rounded-full mt-1">
                                  <Star className="h-3 w-3 text-accent fill-current" />
                                  <span className="text-xs font-medium text-accent">{listing.donor.rating}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-primary text-base font-semibold mb-3">{listing.donor.name}</p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {listing.types.map((type) => getFoodTypeBadge(type))}
                            {listing.blockchainId && (
                              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                                On Blockchain
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="bg-primary/10 px-3 py-2 rounded-full shadow-sm">
                            <p className="text-sm font-medium text-primary">{listing.distance.toFixed(1)}km away</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-3 mb-4 text-sm">
                        <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg border border-border/30">
                          <Package className="h-4 w-4 text-primary" />
                          <span className="font-medium text-card-foreground">
                            {listing.quantity} {listing.unit}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg border border-border/30">
                          <Clock className="h-4 w-4 text-accent" />
                          <span className="font-medium text-card-foreground">
                            Until{" "}
                            {new Date(listing.availableUntil).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg border border-border/30">
                          <Users className="h-4 w-4 text-primary" />
                          <span className="font-medium text-card-foreground">
                            {listing.interestedUsers || 0} interested
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-6 text-muted-foreground bg-muted/30 p-3 rounded-lg">
                        <MapPin className="h-4 w-4 text-accent" />
                        <span className="text-sm">{listing.location.address}</span>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleClaim(listing._id, listing.blockchainId)}
                          disabled={claimingListingId === listing._id}
                          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 shadow-sm hover:shadow-md transition-all"
                        >
                          {claimingListingId === listing._id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Claiming...
                            </>
                          ) : (
                            <>
                              <Heart className="h-4 w-4 mr-2" />
                              Claim Food
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          className="border-border bg-card hover:bg-muted text-card-foreground font-medium h-12 px-6 shadow-sm flex items-center gap-2"
                          onClick={() => {
                            // Open in Google Maps with the listing's coordinates
                            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${listing.location.coordinates.lat},${listing.location.coordinates.lng}`
                            window.open(mapsUrl, '_blank', 'noopener,noreferrer')
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open in Map
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-card/90 backdrop-blur-sm border-border/50 shadow-lg">
                  <CardContent className="p-8 text-center">
                    <div className="p-4 bg-muted/30 rounded-full w-fit mx-auto mb-4">
                      <Package className="h-16 w-16 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-card-foreground">No food found nearby</h3>
                    <p className="text-muted-foreground mb-6">Try expanding your search radius or clearing filters</p>
                    <Button
                      onClick={() => {
                        setSearchQuery("")
                        setVegOnly(false)
                        setMaxDistance(10)
                      }}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm"
                    >
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Right Column - Impact & Actions */}
          <div className="space-y-6">
            {impactStats && (
              <Card className="bg-gradient-to-br from-primary/5 via-card/90 to-accent/5 backdrop-blur-sm border-primary/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Award className="h-5 w-5 text-primary" />
                    </div>
                    Your Community Impact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center p-4 bg-background/50 rounded-xl border border-border/30">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold mb-3 shadow-sm">
                      <Star className="h-4 w-4" />
                      {impactStats.rank}
                    </div>
                    <p className="text-sm text-muted-foreground">{impactStats.nextRankTokens} tokens to next rank</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Coins className="h-5 w-5 text-primary" />
                        <span className="font-bold text-xl text-primary">{impactStats.tokensEarned}</span>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">Tokens Earned</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-accent/10 border border-accent/20 shadow-sm">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Package className="h-5 w-5 text-accent" />
                        <span className="font-bold text-xl text-accent">{impactStats.foodClaimed}</span>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">Food Claimed</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Leaf className="h-5 w-5 text-primary" />
                        <span className="font-bold text-xl text-primary">{impactStats.co2Saved}t</span>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">CO₂ Saved</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-accent/10 border border-accent/20 shadow-sm">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Utensils className="h-5 w-5 text-accent" />
                        <span className="font-bold text-xl text-accent">{impactStats.mealsReceived}</span>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">Meals Received</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-card/90 backdrop-blur-sm border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-card-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start border-accent/30 bg-card hover:bg-accent/10 text-accent font-medium h-12 shadow-sm"
                  onClick={() => router.push("/dashboard/receiver/notifications")}
                >
                  <Bell className="h-5 w-5 mr-3" />
                  View Notifications
                </Button>
                {!isWalletConnected && (
                  <Button
                    onClick={handleConnectWallet}
                    className="w-full justify-start bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-12 shadow-sm hover:shadow-md transition-all"
                  >
                    <Package className="h-5 w-5 mr-3" />
                    Connect Wallet
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent/5 via-card/90 to-primary/5 backdrop-blur-sm border-accent/20 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-accent/10 rounded-full w-fit mx-auto mb-4">
                  <Heart className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-semibold text-card-foreground mb-2">Thank you for making a difference!</h3>
                <p className="text-sm text-muted-foreground">
                  You're helping build a more sustainable community by reducing food waste and supporting local
                  connections.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <QrScannerModal open={qrScanOpen} onOpenChange={setQrScanOpen} />
    </main>
  )
}