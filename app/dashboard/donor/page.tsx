"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from 'next/link'
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNotifications } from '@/context/NotificationsContext'
import type { Notification } from '@/context/NotificationsContext'
import { Badge } from "@/components/ui/badge"
import {
  Utensils,
  Users,
  Bell,
  Leaf,
  TrendingUp,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Package,
  LogOut,
  ChevronLeft, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { FoodType, Freshness, QuantityUnit } from "@/lib/models/FoodListing"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/useAuth"

interface StatsData {
  totalMeals: number
  totalWeight: number
  co2Saved: number
  peopleFed: number
  activeListings: number
  completedPickups: number
  monthlyGrowth: number
  avgResponseTime: number
}

interface FoodListing {
  _id: string
  title: string
  types: FoodType[]
  quantity: number
  unit: QuantityUnit
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
  status: 'draft' | 'published' | 'claimed' | 'completed'
  interestedUsers?: number
  createdAt: Date
}

export default function DashboardPage() {
  const router = useRouter()
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month")
  const [stats, setStats] = useState<StatsData | null>(null)
  const [recentListings, setRecentListings] = useState<FoodListing[]>([])
  const { notifications, unreadCount } = useNotifications()
  const [currentIndex, setCurrentIndex] = useState(0)
  const { toast } = useToast()
  const { user } = useAuth()

  const [loading, setLoading] = useState({
    stats: true,
    listings: true
  })
  const [error, setError] = useState({
    stats: null as string | null,
    listings: null as string | null
  })

  const fetchListings = async () => {
    try {
      setLoading(prev => ({...prev, listings: true}))
      setError(prev => ({...prev, listings: null}))

      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/listings', {
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
      const publishedListings = data.listings
        ?.filter((listing: FoodListing) => listing.status === 'published')
        ?.sort((a: FoodListing, b: FoodListing) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ) || []
      
      setRecentListings(publishedListings.slice(0, 10))
      setLoading(prev => ({...prev, listings: false}))
    } catch (err) {
      setError(prev => ({...prev, listings: err instanceof Error ? err.message : 'Failed to load listings'}))
      setLoading(prev => ({...prev, listings: false}))
      console.error('Error fetching listings:', err)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats (mock for now)
        const mockStats = {
          totalMeals: 2847,
          totalWeight: 1423,
          co2Saved: 3.2,
          peopleFed: 1892,
          activeListings: recentListings.length,
          completedPickups: 156,
          monthlyGrowth: 23.5,
          avgResponseTime: 18,
        }
        setStats(mockStats)
        setLoading(prev => ({...prev, stats: false}))
        setError(prev => ({...prev, stats: null}))
      } catch (err) {
        setError(prev => ({...prev, stats: err instanceof Error ? err.message : 'Failed to load stats'}))
        setLoading(prev => ({...prev, stats: false}))
      }

      // Fetch listings
      await fetchListings()
    }

    fetchData()
  }, [])

  const handleListFood = () => {
    router.push("/dashboard/donor/list-food")
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
      <Badge className={`text-xs ${typeMap[type].color}`}>
        {typeMap[type].label}
      </Badge>
    )
  }

  const getFreshnessIcon = (freshness: Freshness) => {
    const iconMap = {
      'fresh-hot': '🔥',
      'fresh-chilled': '❄️',
      'frozen': '🧊',
      'room-temp': '🌡️',
      'packaged': '📦'
    }
    return <span className="text-sm">{iconMap[freshness]}</span>
  }

  if (loading.stats && loading.listings) {
    return (
      <main className="min-h-screen bg-gray-950 text-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-gray-400">Loading dashboard...</div>
          </div>
        </div>
      </main>
    )
  }

  if (error.stats) {
    return (
      <main className="min-h-screen bg-gray-950 text-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 text-red-200">
            <AlertCircle className="h-5 w-5 inline mr-2" />
            {error.stats}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-gray-400 mt-1">Track your food rescue impact and manage listings</p>
          </div>
          <div className="flex gap-3">
            {unreadCount > 0 && (
              <Link href="/dashboard/donor/notifications">
                <Button variant="outline" className="relative border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300">
                  <Bell className="h-5 w-5 mr-2" />
                  Notifications
                  <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-xs">
                    {unreadCount}
                  </span>
                </Button>
              </Link>
            )}
            <Button
              onClick={() => {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                router.push('/auth/login');
              }}
              variant="outline"
              className="border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </Button>
            <Button
              onClick={handleListFood}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Plus className="h-5 w-5 mr-2" />
              List Food
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Meals Donated"
              value={stats.totalMeals.toLocaleString()}
              change={`+${stats.monthlyGrowth}%`}
              icon={<Utensils className="h-6 w-6" />}
              trend="up"
            />
            <StatsCard
              title="People Fed"
              value={stats.peopleFed.toLocaleString()}
              change="+12.3%"
              icon={<Users className="h-6 w-6" />}
              trend="up"
            />
            <StatsCard
              title="CO₂ Saved"
              value={`${stats.co2Saved} tons`}
              change="+8.7%"
              icon={<Leaf className="h-6 w-6" />}
              trend="up"
            />
            <StatsCard
              title="Food Weight"
              value={`${stats.totalWeight} kg`}
              change="+15.2%"
              icon={<Package className="h-6 w-6" />}
              trend="up"
            />
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Impact Chart */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    Impact Over Time
                  </CardTitle>
                  <div className="flex gap-2">
                    {(["week", "month", "year"] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={cn(
                          "px-3 py-1 rounded-md text-sm transition-colors",
                          timeRange === range
                            ? "bg-emerald-500/20 text-emerald-100 border border-emerald-500/30"
                            : "text-gray-400 hover:text-gray-200",
                        )}
                      >
                        {range.charAt(0).toUpperCase() + range.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64 rounded-lg bg-gray-900/50 border border-gray-800 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2 text-emerald-400" />
                    <p>Impact chart visualization</p>
                    <p className="text-sm">Meals donated, CO₂ saved, people fed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Listings */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-400" />
                  Recent Listings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {error.listings ? (
                  <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 text-red-200">
                    <AlertCircle className="h-5 w-5 inline mr-2" />
                    {error.listings}
                    <Button
                      onClick={fetchListings}
                      className="mt-2 bg-transparent border-red-500/40 text-red-100 hover:bg-red-500/10"
                      size="sm"
                    >
                      Retry
                    </Button>
                  </div>
                ) : loading.listings ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-pulse text-gray-400">Loading listings...</div>
                  </div>
                ) : recentListings.length > 0 ? (
                  <div className="flex flex-col">
                    {/* Two listings side by side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recentListings.slice(currentIndex, currentIndex + 2).map((listing) =>  (
                        <div
                          key={listing._id}
                          className="rounded-lg border border-gray-800 bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
                        >
                          {/* Image Section */}
                          <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                            {listing.images && listing.images.length > 0 ? (
                              <img
                                src={listing.images[0]}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                <Package className="h-16 w-16 text-gray-500" />
                              </div>
                            )}
                          </div>
                          
                          {/* Listing Details */}
                          <div className="p-4">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium">{listing.title}</h4>
                              <Badge
                                className={cn(
                                  "text-xs",
                                  listing.status === "published" && "bg-emerald-500/20 text-emerald-100 border-emerald-500/30",
                                  listing.status === "claimed" && "bg-purple-500/20 text-purple-100 border-purple-500/30",
                                  listing.status === "completed" && "bg-blue-500/20 text-blue-100 border-blue-500/30",
                                )}
                              >
                                {listing.status}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                              {listing.types.map(type => getFoodTypeBadge(type))}
                              <span className="flex items-center gap-1">
                                {getFreshnessIcon(listing.freshness)}
                                {listing.quantity} {listing.unit}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {listing.location.address}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {new Date(listing.availableUntil).toLocaleDateString()}
                              </span>
                            </div>
                            {listing.interestedUsers && (
                              <p className="text-sm text-emerald-400 font-medium mt-2">
                                {listing.interestedUsers} interested
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Navigation Controls */}
                    {recentListings.length > 2 && (
                      <div className="flex justify-center gap-4 mt-6 mb-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-white"
                          onClick={() => setCurrentIndex(prev => Math.max(prev - 2, 0))}
                          disabled={currentIndex === 0}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-white"
                          onClick={() => setCurrentIndex(prev => Math.min(prev + 2, recentListings.length - 2))}
                          disabled={currentIndex >= recentListings.length - 2}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Package className="h-10 w-10 mx-auto mb-4 text-gray-500" />
                    <p>No recent listings found</p>
                    <Button
                      onClick={handleListFood}
                      className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      Create your first listing
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleListFood}
                  className="w-full justify-start bg-emerald-600 hover:bg-emerald-500 text-white"
                  size="lg"
                >
                  <Plus className="h-5 w-5 mr-3" />
                  List Surplus Food
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white"
                >
                  <Users className="h-5 w-5 mr-3" />
                  View Receivers
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white"
                >
                  <TrendingUp className="h-5 w-5 mr-3" />
                  Impact Report
                </Button>
              </CardContent>
            </Card>

            {/* Updated Notifications Card */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-emerald-400" />
                    Notifications
                    {unreadCount > 0 && (
                      <Badge className="ml-2 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                        {unreadCount} new
                      </Badge>
                    )}
                  </CardTitle>
                  <Link href="/dashboard/donor/notifications">
                    <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notifications.slice(0, 3).map((notification) => (
                    <NotificationItem 
                      key={notification._id} 
                      notification={notification} 
                    />
                  ))}
                  {notifications.length === 0 && (
                    <div className="text-center py-4 text-gray-400">
                      <Bell className="h-6 w-6 mx-auto mb-2" />
                      <p>No notifications yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            {stats && (
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle>Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Active Listings</span>
                    <span className="font-semibold text-emerald-400">{stats.activeListings}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Completed Pickups</span>
                    <span className="font-semibold text-emerald-400">{stats.completedPickups}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Avg Response Time</span>
                    <span className="font-semibold text-emerald-400">{stats.avgResponseTime}m</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Success Rate</span>
                    <span className="font-semibold text-emerald-400">94%</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

function StatsCard({
  title,
  value,
  change,
  icon,
  trend,
}:{
  title: string
  value: string
  change: string
  icon: React.ReactNode
  trend: "up" | "down"
}) {
  return (
    <Card className="bg-gray-900 border-gray-800 hover:border-emerald-500/30 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="text-emerald-400">{icon}</div>
          <div
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trend === "up" ? "text-emerald-400" : "text-red-400",
            )}
          >
            <TrendingUp className={cn("h-4 w-4", trend === "down" && "rotate-180")} />
            {change}
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-bold">{value}</h3>
          <p className="text-sm text-gray-400">{title}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function NotificationItem({ notification }: { notification: Notification }) {
  const { markAsRead } = useNotifications()

  const getNotificationIcon = () => {
    switch (notification.type) {
      case "pickup":
        return <Users className="h-4 w-4" />
      case "expiring":
        return <Clock className="h-4 w-4" />
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  return (
    <div
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-colors",
        !notification.read 
          ? "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
          : "border-gray-800 bg-gray-800/30 hover:bg-gray-800/50",
        notification.urgent && "border-yellow-500/30 bg-yellow-500/10"
      )}
      onClick={() => markAsRead(notification._id)}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "p-1 rounded-full",
            notification.type === "pickup" && "bg-emerald-500/20 text-emerald-300",
            notification.type === "expiring" && "bg-yellow-500/20 text-yellow-300",
            notification.type === "completed" && "bg-blue-500/20 text-blue-300",
          )}
        >
          {getNotificationIcon()}
        </div>
        <div className="flex-1">
          <p className={cn(
            "text-sm",
            !notification.read && "font-medium text-white",
            notification.read && "text-gray-300"
          )}>
            {notification.message}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(notification.createdAt).toLocaleString()}
          </p>
        </div>
        {!notification.read && (
          <span className="h-2 w-2 rounded-full bg-emerald-400 mt-2" />
        )}
      </div>
    </div>
  )
}