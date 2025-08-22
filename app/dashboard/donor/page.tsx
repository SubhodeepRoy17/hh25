//app/dashboard/donor/page.tsx
"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import Link from 'next/link'
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  Droplets,
  QrCode,
  Calendar,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { cn } from "@/lib/utils"
import { FoodType, Freshness, QuantityUnit } from "@/lib/models/FoodListing"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/useAuth"
import QrScannerModal from "@/components/receiver/qr-scanner-modal"

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

interface AnalyticsData {
  timeline: {
    date: string
    meals: number
    co2: number
    water: number
    people: number
  }[]
  impactSummary: {
    totalCO2Saved: number // in kg
    totalWaterSaved: number // in liters
    equivalentCarMiles: number
    equivalentShowers: number
    equivalentEnergy: number // in kWh
  }
  foodTypeDistribution: {
    type: FoodType
    percentage: number
  }[]
  completionRate: number
  responseTimes: {
    average: number // in minutes
    trend: 'improving' | 'declining' | 'stable'
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month")
  const [stats, setStats] = useState<StatsData | null>(null)
  const [recentListings, setRecentListings] = useState<FoodListing[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const { notifications, unreadCount } = useNotifications()
  const [currentIndex, setCurrentIndex] = useState(0)
  const { toast } = useToast()
  const { user } = useAuth()
  const [qrScannerOpen, setQrScannerOpen] = useState(false)

  const [loading, setLoading] = useState({
    stats: true,
    analytics: true,
    listings: true
  })
  const [error, setError] = useState({
    stats: null as string | null,
    analytics: null as string | null,
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

  const fetchAnalyticsData = async (range: "week" | "month" | "year") => {
  try {
    setLoading(prev => ({...prev, analytics: true}))
    setError(prev => ({...prev, analytics: null}))

    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`/api/analytics?range=${range}`, {
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
      setAnalytics(data)
      setLoading(prev => ({...prev, analytics: false}))
    } catch (err) {
      setError(prev => ({...prev, analytics: err instanceof Error ? err.message : 'Failed to load analytics'}))
      setLoading(prev => ({...prev, analytics: false}))
      console.error('Error fetching analytics:', err)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats (now using real data)
        const token = localStorage.getItem('authToken')
        if (!token) {
          throw new Error('No authentication token found')
        }

        // Fetch summary stats
        const statsResponse = await fetch('/api/listings/stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })

        if (!statsResponse.ok) {
          throw new Error(`HTTP error! status: ${statsResponse.status}`)
        }

        const statsData = await statsResponse.json()
        setStats(statsData)

        // Fetch analytics data
        await fetchAnalyticsData(timeRange)

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
  }, [timeRange])

  const handleTimeRangeChange = (range: "week" | "month" | "year") => {
    setTimeRange(range)
    fetchAnalyticsData(range)
  }

  const handleListFood = () => {
    router.push("/dashboard/donor/list-food")
  }

  const getFoodTypeBadge = (type: FoodType) => {
    const typeMap = {
      cooked: { label: 'Cooked', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      produce: { label: 'Produce', color: 'bg-green-100 text-green-800 border-green-200' },
      bakery: { label: 'Bakery', color: 'bg-amber-100 text-amber-800 border-amber-200' },
      packaged: { label: 'Packaged', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      beverages: { label: 'Beverages', color: 'bg-sky-100 text-sky-800 border-sky-200' },
      mixed: { label: 'Mixed', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      vegetarian: { label: 'Vegetarian', color: 'bg-green-100 text-green-800 border-green-200' },
      vegan: { label: 'Vegan', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    }
    return (
      <Badge variant="outline" className={`text-xs ${typeMap[type].color}`}>
        {typeMap[type].label}
      </Badge>
    )
  }

  const fetchData = useCallback(async () => {
    try {
      // Fetch stats (now using real data)
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Fetch summary stats
      const statsResponse = await fetch('/api/listings/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!statsResponse.ok) {
        throw new Error(`HTTP error! status: ${statsResponse.status}`)
      }

      const statsData = await statsResponse.json()
      setStats(statsData)

      // Fetch analytics data
      await fetchAnalyticsData(timeRange)

      setLoading(prev => ({...prev, stats: false}))
      setError(prev => ({...prev, stats: null}))
    } catch (err) {
      setError(prev => ({...prev, stats: err instanceof Error ? err.message : 'Failed to load stats'}))
      setLoading(prev => ({...prev, stats: false}))
    }

    // Fetch listings
    await fetchListings()
  }, [timeRange, fetchAnalyticsData, fetchListings]);

  const handleScanSuccess = (qrData: string) => {
    // Refresh data after successful scan
    fetchData();
  };

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
      <main className="min-h-screen bg-gray-50 text-gray-900">
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
      <main className="min-h-screen bg-gray-50 text-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-red-800">
            <AlertCircle className="h-5 w-5 inline mr-2" />
            {error.stats}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Track your food rescue impact and manage listings</p>
          </div>
          <div className="flex gap-3">
            {unreadCount > 0 && (
              <Link href="/dashboard/donor/notifications">
                <Button variant="outline" className="relative border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 transition-all duration-200 shadow-sm">
                  <Bell className="h-5 w-5 mr-2" />
                  Notifications
                  <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center text-xs font-medium text-white shadow-lg">
                    {unreadCount}
                  </span>
                </Button>
              </Link>
            )}
            <Button
              onClick={() => setQrScannerOpen(true)}
              variant="outline"
              className="border-blue-200 bg-white text-blue-700 hover:bg-blue-50 transition-all duration-200 shadow-sm"
            >
              <QrCode className="h-5 w-5 mr-2" />
              Scan QR
            </Button>
            <Button
              onClick={() => {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                router.push('/auth/login');
              }}
              variant="outline"
              className="border-red-200 bg-white text-red-700 hover:bg-red-50 transition-all duration-200 shadow-sm"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </Button>
            <Button
              onClick={handleListFood}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg hover:shadow-emerald-500/25 transition-all duration-200"
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
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    Impact Analytics
                  </CardTitle>
                  <div className="flex gap-2">
                    {(["week", "month", "year"] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => handleTimeRangeChange(range)}
                        className={cn(
                          "px-3 py-1 rounded-md text-sm transition-all duration-200",
                          timeRange === range
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent",
                        )}
                      >
                        {range.charAt(0).toUpperCase() + range.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading.analytics ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-pulse text-gray-400">Loading analytics...</div>
                  </div>
                ) : error.analytics ? (
                  <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-red-800">
                    <AlertCircle className="h-5 w-5 inline mr-2" />
                    {error.analytics}
                  </div>
                ) : analytics ? (
                  <>
                    {/* Timeline Chart */}
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={analytics.timeline}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#6b7280"
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            stroke="#6b7280"
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#ffffff',
                              borderColor: '#e5e7eb',
                              borderRadius: '0.5rem',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                            }}
                            itemStyle={{ color: '#374151' }}
                            labelStyle={{ color: '#6b7280', fontWeight: 'bold' }}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="meals"
                            name="Meals Donated"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.2}
                          />
                          <Area
                            type="monotone"
                            dataKey="people"
                            name="People Fed"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Environmental Impact Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-full bg-emerald-100 text-emerald-600">
                            <Leaf className="h-5 w-5" />
                          </div>
                          <h4 className="font-semibold text-gray-900">Carbon Impact</h4>
                        </div>
                        <div className="space-y-2">
                          <p className="text-2xl font-bold text-emerald-700">
                            {Math.round(analytics.impactSummary.totalCO2Saved / 100) / 10} tons CO₂
                          </p>
                          <p className="text-sm text-gray-600">
                            Equivalent to {analytics.impactSummary.equivalentCarMiles} car miles
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                            <Droplets className="h-5 w-5" />
                          </div>
                          <h4 className="font-semibold text-gray-900">Water Saved</h4>
                        </div>
                        <div className="space-y-2">
                          <p className="text-2xl font-bold text-blue-700">
                            {Math.round(analytics.impactSummary.totalWaterSaved / 1000)} m³
                          </p>
                          <p className="text-sm text-gray-600">
                            Equivalent to {analytics.impactSummary.equivalentShowers} showers
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <p className="text-sm text-gray-600">Completion Rate</p>
                        <p className="text-xl font-bold text-gray-900">
                          {Math.round(analytics.completionRate)}%
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <p className="text-sm text-gray-600">Avg Response Time</p>
                        <p className="text-xl font-bold text-gray-900">
                          {analytics.responseTimes.average}m
                          <span className={cn(
                            "ml-2 text-xs",
                            analytics.responseTimes.trend === 'improving' ? 'text-emerald-600' : 
                            analytics.responseTimes.trend === 'declining' ? 'text-red-600' : 'text-gray-600'
                          )}>
                            {analytics.responseTimes.trend === 'improving' ? '↓ Improving' : 
                             analytics.responseTimes.trend === 'declining' ? '↑ Declining' : '→ Stable'}
                          </span>
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <p className="text-sm text-gray-600">Food Types</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {analytics.foodTypeDistribution.map((item) => (
                            <Badge 
                              key={item.type}
                              variant="outline"
                              className="text-xs text-gray-700 border-gray-300 bg-white"
                            >
                              {item.type}: {item.percentage}%
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>

            {/* Recent Listings */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Package className="h-5 w-5 text-emerald-600" />
                  Recent Listings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {error.listings ? (
                  <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-red-800">
                    <AlertCircle className="h-5 w-5 inline mr-2" />
                    {error.listings}
                    <Button
                      onClick={fetchListings}
                      className="mt-2 bg-transparent border-red-300 text-red-700 hover:bg-red-50"
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
                          className="rounded-lg border border-gray-200 bg-white hover:shadow-md transition-all duration-200 overflow-hidden"
                        >
                          {/* Image Section */}
                          <div className="relative h-48 w-full overflow-hidden">
                            {listing.images && listing.images.length > 0 ? (
                              <img
                                src={listing.images[0]}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <Package className="h-16 w-16 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* Listing Details */}
                          <div className="p-4">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-gray-900">{listing.title}</h4>
                              <Badge
                                className={cn(
                                  "text-xs",
                                  listing.status === "published" && "bg-emerald-100 text-emerald-800 border-emerald-200",
                                  listing.status === "claimed" && "bg-blue-100 text-blue-800 border-blue-200",
                                  listing.status === "completed" && "bg-orange-100 text-orange-800 border-orange-200",
                                )}
                              >
                                {listing.status}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
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
                              <p className="text-sm text-emerald-700 font-medium mt-2">
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
                          className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm"
                          onClick={() => setCurrentIndex(prev => Math.max(prev - 2, 0))}
                          disabled={currentIndex === 0}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm"
                          onClick={() => setCurrentIndex(prev => Math.min(prev + 2, recentListings.length - 2))}
                          disabled={currentIndex >= recentListings.length - 2}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-600">
                    <Package className="h-10 w-10 mx-auto mb-4 text-gray-400" />
                    <p>No recent listings found</p>
                    <Button
                      onClick={handleListFood}
                      className="mt-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg hover:shadow-emerald-500/25 transition-all duration-200"
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
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleListFood}
                  className="w-full justify-start bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg hover:shadow-emerald-500/25 transition-all duration-200"
                  size="lg"
                >
                  <Plus className="h-5 w-5 mr-3" />
                  List Surplus Food
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm"
                  onClick={() => router.push('/dashboard/donor/calendar-integration')}
                >
                  <Calendar className="h-5 w-5 mr-3" />
                  Calendar Integration
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm"
                >
                  <TrendingUp className="h-5 w-5 mr-3" />
                  Impact Report
                </Button>
              </CardContent>
            </Card>

            {/* Updated Notifications Card */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <AlertCircle className="h-5 w-5 text-emerald-600" />
                    Notifications
                    {unreadCount > 0 && (
                      <Badge className="ml-2 bg-emerald-100 text-emerald-800 border-emerald-200">
                        {unreadCount} new
                      </Badge>
                    )}
                  </CardTitle>
                  <Link href="/dashboard/donor/notifications">
                    <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
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
                    <div className="text-center py-4 text-gray-600">
                      <Bell className="h-6 w-6 mx-auto mb-2" />
                      <p>No notifications yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            {stats && (
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900">Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Active Listings</span>
                    <span className="font-semibold text-emerald-700">{stats.activeListings}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Completed Pickups</span>
                    <span className="font-semibold text-emerald-700">{stats.completedPickups}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Avg Response Time</span>
                    <span className="font-semibold text-emerald-700">{stats.avgResponseTime}m</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Success Rate</span>
                    <span className="font-semibold text-emerald-700">94%</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        <QrScannerModal
          open={qrScannerOpen}
          onOpenChange={setQrScannerOpen}
          onScanSuccess={handleScanSuccess}
        />
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
    <Card className="bg-white border-gray-200 hover:border-emerald-300 transition-all duration-200 shadow-sm hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="text-emerald-600 p-2 bg-emerald-100 rounded-full">{icon}</div>
          <div
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trend === "up" ? "text-emerald-600" : "text-red-600",
            )}
          >
            {trend === "up" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            {change}
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          <p className="text-sm text-gray-600">{title}</p>
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
        "p-3 rounded-lg border cursor-pointer transition-all duration-200",
        !notification.read 
          ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
          : "border-gray-200 bg-white hover:bg-gray-50",
        notification.urgent && "border-orange-200 bg-orange-50"
      )}
      onClick={() => markAsRead(notification._id)}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "p-1 rounded-full mt-1",
            notification.type === "pickup" && "bg-emerald-100 text-emerald-600",
            notification.type === "expiring" && "bg-orange-100 text-orange-600",
            notification.type === "completed" && "bg-blue-100 text-blue-600",
          )}
        >
          {getNotificationIcon()}
        </div>
        <div className="flex-1">
          <p className={cn(
            "text-sm",
            !notification.read && "font-medium text-gray-900",
            notification.read && "text-gray-700"
          )}>
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(notification.createdAt).toLocaleString()}
          </p>
        </div>
        {!notification.read && (
          <span className="h-2 w-2 rounded-full bg-emerald-500 mt-2" />
        )}
      </div>
    </div>
  )
}