"use client"

import { useState } from "react"
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

// Mock data
const mockListings = [
  {
    id: 1,
    title: "60 hot vegetarian meals",
    donor: "Main Campus Canteen",
    distance: 0.8,
    quantity: 60,
    unit: "meals",
    type: "vegetarian",
    freshness: "fresh-hot",
    availableUntil: "2024-01-15T18:00:00",
    location: "Building A, Loading Dock",
    claimed: 15,
    tags: ["vegetarian", "hot", "indian"],
    rating: 4.8,
  },
  {
    id: 2,
    title: "Fresh produce and fruits",
    donor: "Weekend Farmers Market",
    distance: 1.2,
    quantity: 25,
    unit: "kg",
    type: "vegan",
    freshness: "fresh-chilled",
    availableUntil: "2024-01-15T20:00:00",
    location: "Market Square, Stall 12",
    claimed: 8,
    tags: ["vegan", "organic", "fresh"],
    rating: 4.9,
  },
  {
    id: 3,
    title: "Bakery items - bread & pastries",
    donor: "Student Center Cafe",
    distance: 0.5,
    quantity: 40,
    unit: "items",
    type: "vegetarian",
    freshness: "room-temp",
    availableUntil: "2024-01-16T10:00:00",
    location: "Student Center, Back Door",
    claimed: 22,
    tags: ["bakery", "sweet", "bread"],
    rating: 4.6,
  },
]

const mockNotifications = [
  {
    id: 1,
    type: "new_match",
    title: "New vegetarian meals available",
    message: "60 hot meals at Main Campus Canteen - 0.8km away",
    time: "2 minutes ago",
    urgent: true,
    read: false,
  },
  {
    id: 2,
    type: "pickup_reminder",
    title: "Pickup reminder",
    message: "Don't forget to collect your claimed produce at Market Square",
    time: "30 minutes ago",
    urgent: false,
    read: false,
  },
  {
    id: 3,
    type: "tokens_earned",
    title: "Tokens earned!",
    message: "You earned 15 tokens for completing yesterday's pickup",
    time: "2 hours ago",
    urgent: false,
    read: true,
  },
]

const mockImpactStats = {
  tokensEarned: 1247,
  foodClaimed: 89,
  co2Saved: 2.3,
  mealsReceived: 156,
  rank: "Gold Rescuer",
  nextRankTokens: 253,
}

export default function ReceiverDashboardPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [vegOnly, setVegOnly] = useState(false)
  const [maxDistance, setMaxDistance] = useState(5)
  const [qrScanOpen, setQrScanOpen] = useState(false)
  const [selectedListing, setSelectedListing] = useState<number | null>(null)

  const filteredListings = mockListings.filter((listing) => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesVeg = !vegOnly || listing.type === "vegetarian" || listing.type === "vegan"
    const matchesDistance = listing.distance <= maxDistance
    return matchesSearch && matchesVeg && matchesDistance
  })

  const unreadNotifications = mockNotifications.filter((n) => !n.read).length

  const handleClaim = (listingId: number) => {
    setSelectedListing(listingId)
    // In real app, this would create a claim and show success
    alert(`Claimed listing ${listingId}! Check your notifications for pickup details.`)
  }

  const handleQrScan = () => {
    setQrScanOpen(true)
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
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </Button>
          </div>
        </div>

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
                      <Switch id="veg-only" checked={vegOnly} onCheckedChange={setVegOnly} />
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
              {filteredListings.map((listing) => (
                <Card
                  key={listing.id}
                  className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800 hover:border-emerald-500/30 transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white text-lg">{listing.title}</h3>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-300">{listing.rating}</span>
                          </div>
                        </div>
                        <p className="text-emerald-300 text-sm font-medium mb-2">{listing.donor}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {listing.tags.map((tag) => (
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
                        <Badge
                          className={cn(
                            "mb-2",
                            listing.type === "vegetarian" && "bg-green-500/20 text-green-100 border-green-500/30",
                            listing.type === "vegan" && "bg-emerald-500/20 text-emerald-100 border-emerald-500/30",
                          )}
                        >
                          {listing.type}
                        </Badge>
                        <p className="text-sm text-gray-400">{listing.distance}km away</p>
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
                        <span>{listing.claimed} claimed</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span>{listing.location}</span>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleClaim(listing.id)}
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
              ))}
            </div>
          </div>

          {/* Right Column - Notifications & Impact */}
          <div className="space-y-6">
            {/* Impact Profile */}
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
                    {mockImpactStats.rank}
                  </div>
                  <p className="text-sm text-gray-400">{mockImpactStats.nextRankTokens} tokens to next rank</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Coins className="h-4 w-4 text-emerald-300" />
                      <span className="font-bold text-emerald-100">{mockImpactStats.tokensEarned}</span>
                    </div>
                    <p className="text-xs text-gray-400">Tokens Earned</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Package className="h-4 w-4 text-emerald-300" />
                      <span className="font-bold text-emerald-100">{mockImpactStats.foodClaimed}</span>
                    </div>
                    <p className="text-xs text-gray-400">Food Claimed</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Leaf className="h-4 w-4 text-emerald-300" />
                      <span className="font-bold text-emerald-100">{mockImpactStats.co2Saved}t</span>
                    </div>
                    <p className="text-xs text-gray-400">CO₂ Saved</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Utensils className="h-4 w-4 text-emerald-300" />
                      <span className="font-bold text-emerald-100">{mockImpactStats.mealsReceived}</span>
                    </div>
                    <p className="text-xs text-gray-400">Meals Received</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Center */}
            <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Bell className="h-5 w-5 text-emerald-300" />
                    Notifications
                    {unreadNotifications > 0 && (
                      <Badge className="bg-red-500/20 text-red-100 border-red-500/30 text-xs">
                        {unreadNotifications}
                      </Badge>
                    )}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/dashboard/receiver/notifications")}
                    className="text-emerald-300 hover:text-emerald-100"
                  >
                    View all
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockNotifications.slice(0, 3).map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-3 rounded-lg border transition-colors",
                        notification.urgent
                          ? "border-yellow-500/30 bg-yellow-500/10"
                          : "border-gray-800 bg-gray-900/30",
                        !notification.read && "ring-1 ring-emerald-500/20",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "p-1 rounded-full mt-0.5",
                            notification.type === "new_match" && "bg-emerald-500/20 text-emerald-300",
                            notification.type === "pickup_reminder" && "bg-yellow-500/20 text-yellow-300",
                            notification.type === "tokens_earned" && "bg-blue-500/20 text-blue-300",
                          )}
                        >
                          {notification.type === "new_match" && <AlertCircle className="h-4 w-4" />}
                          {notification.type === "pickup_reminder" && <Timer className="h-4 w-4" />}
                          {notification.type === "tokens_earned" && <Coins className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-white">{notification.title}</h4>
                          <p className="text-xs text-gray-300 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                        {!notification.read && <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2" />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

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
