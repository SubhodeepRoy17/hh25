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
  Menu,
  X,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <div className="container mx-auto px-4 py-8">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="hidden lg:block">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Track your food rescue impact and manage listings</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {unreadCount > 0 && (
              <Link href="/dashboard/donor/notifications">
                <Button variant="outline" size="sm" className="relative border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 transition-all duration-200 shadow-sm text-xs sm:text-sm">
                  <Bell className="h-4 w-4 mr-1 sm:mr-2 sm:h-5 sm:w-5" />
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
              size="sm"
              className="border-blue-200 bg-white text-blue-700 hover:bg-blue-50 transition-all duration-200 shadow-sm text-xs sm:text-sm"
            >
              <QrCode className="h-4 w-4 mr-1 sm:mr-2 sm:h-5 sm:w-5" />
              Scan QR
            </Button>
            <Button
              onClick={() => {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                router.push('/auth/login');
              }}
              variant="outline"
              size="sm"
              className="border-red-200 bg-white text-red-700 hover:bg-red-50 transition-all duration-200 shadow-sm text-xs sm:text-sm"
            >
              <LogOut className="h-4 w-4 mr-1 sm:mr-2 sm:h-5 sm:w-5" />
              Logout
            </Button>
            <Button
              onClick={handleListFood}
              size="sm"
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 text-xs sm:text-sm"
            >
              <Plus className="h-4 w-4 mr-1 sm:mr-2 sm:h-5 sm:w-5" />
              List Food
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Meals Donated"
              value={stats.totalMeals.toLocaleString()}
              change={`+${stats.monthlyGrowth}%`}
              icon={<Utensils className="h-5 w-5 sm:h-6 sm:w-6" />}
              trend="up"
            />
            <StatsCard
              title="People Fed"
              value={stats.peopleFed.toLocaleString()}
              change="+12.3%"
              icon={<Users className="h-5 w-5 sm:h-6 sm:w-6" />}
              trend="up"
            />
            <StatsCard
              title="CO₂ Saved"
              value={`${stats.co2Saved} tons`}
              change="+8.7%"
              icon={<Leaf className="h-5 w-5 sm:h-6 sm:w-6" />}
              trend="up"
            />
            <StatsCard
              title="Food Weight"
              value={`${stats.totalWeight} kg`}
              change="+15.2%"
              icon={<Package className="h-5 w-5 sm:h-6 sm:w-6" />}
              trend="up"
            />
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column */}
          <div className="flex-1 space-y-6">
            {/* Impact Chart */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-gray-900 text-lg sm:text-xl">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    Impact Analytics
                  </CardTitle>
                  <div className="flex gap-1 sm:gap-2 flex-wrap">
                    {(["week", "month", "year"] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => handleTimeRangeChange(range)}
                        className={cn(
                          "px-2 py-1 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm transition-all duration-200 font-medium",
                          timeRange === range
                            ? "bg-emerald-600 text-white border border-emerald-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300",
                        )}
                      >
                        {range.charAt(0).toUpperCase() + range.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-6">
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
                    {/* Timeline Chart with Toggle */}
                    <div className="flex justify-end mb-2">
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                          className={cn(
                            "px-2 py-1 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm transition-all duration-200",
                            "meals" === "meals" 
                              ? "bg-white text-emerald-600 shadow-sm font-medium"
                              : "text-gray-600 hover:text-gray-900"
                          )}
                        >
                          Meals & People
                        </button>
                      </div>
                    </div>
                    
                    <div className="h-64 sm:h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analytics.timeline}
                          margin={{ top: 20, right: 10, left: 0, bottom: 10 }}
                        >
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke="#e5e7eb" 
                            vertical={false}
                          />
                          <XAxis 
                            dataKey="date" 
                            stroke="#6b7280"
                            tick={{ fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis 
                            stroke="#6b7280"
                            tick={{ fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#ffffff',
                              borderColor: '#e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                              padding: '12px'
                            }}
                            itemStyle={{ 
                              color: '#374151',
                              padding: '4px 0',
                              fontSize: '12px'
                            }}
                            labelStyle={{ 
                              color: '#111827', 
                              fontWeight: 'bold',
                              fontSize: '12px',
                              marginBottom: '8px'
                            }}
                            formatter={(value, name) => {
                              if (name === 'meals') return [`${value} meals`, 'Meals Donated'];
                              if (name === 'people') return [`${value} people`, 'People Fed'];
                              if (name === 'co2') return [`${value} kg`, 'CO₂ Saved'];
                              if (name === 'water') return [`${value} L`, 'Water Saved'];
                              return [value, name];
                            }}
                          />
                          <Legend 
                            verticalAlign="top" 
                            height={36}
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{
                              paddingBottom: '12px',
                              fontSize: '12px'
                            }}
                          />
                          <Bar
                            dataKey="meals"
                            name="Meals Donated"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                            fillOpacity={0.8}
                          />
                          <Bar
                            dataKey="people"
                            name="People Fed"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                            fillOpacity={0.8}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Mini Charts for Environmental Data */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {/* CO2 Saved Mini Chart */}
                      <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-1 sm:p-2 rounded-full bg-emerald-600/20 text-emerald-600">
                              <Leaf className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 text-sm sm:text-base">CO₂ Saved</h4>
                              <p className="text-xs sm:text-sm text-gray-600">This {timeRange}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg sm:text-2xl font-bold text-emerald-700">
                              {Math.round(analytics.timeline.reduce((sum, item) => sum + item.co2, 0) / 100) / 10} kg
                            </p>
                          </div>
                        </div>
                        <div className="h-16 sm:h-20">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={analytics.timeline}
                              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                            >
                              <Area
                                type="monotone"
                                dataKey="co2"
                                stroke="#10b981"
                                fill="#10b981"
                                fillOpacity={0.3}
                                strokeWidth={2}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#ffffff',
                                  borderColor: '#e5e7eb',
                                  borderRadius: '6px',
                                  padding: '8px',
                                  fontSize: '12px'
                                }}
                                formatter={(value) => [`${value} kg`, 'CO₂ Saved']}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Water Saved Mini Chart */}
                      <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-1 sm:p-2 rounded-full bg-blue-600/20 text-blue-600">
                              <Droplets className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Water Saved</h4>
                              <p className="text-xs sm:text-sm text-gray-600">This {timeRange}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg sm:text-2xl font-bold text-blue-700">
                              {Math.round(analytics.timeline.reduce((sum, item) => sum + item.water, 0))} L
                            </p>
                          </div>
                        </div>
                        <div className="h-16 sm:h-20">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={analytics.timeline}
                              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                            >
                              <Area
                                type="monotone"
                                dataKey="water"
                                stroke="#3b82f6"
                                fill="#3b82f6"
                                fillOpacity={0.3}
                                strokeWidth={2}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#ffffff',
                                  borderColor: '#e5e7eb',
                                  borderRadius: '6px',
                                  padding: '8px',
                                  fontSize: '12px'
                                }}
                                formatter={(value) => [`${value} L`, 'Water Saved']}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Additional Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                          <p className="text-xs sm:text-sm font-medium text-gray-900">Completion Rate</p>
                        </div>
                        <p className="text-lg sm:text-2xl font-bold text-gray-900">
                          {Math.round(analytics.completionRate)}%
                        </p>
                      </div>
                      <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                          <p className="text-xs sm:text-sm font-medium text-gray-900">Avg Response Time</p>
                        </div>
                        <p className="text-lg sm:text-2xl font-bold text-gray-900">
                          {analytics.responseTimes.average}m
                          <span className={cn(
                            "ml-1 sm:ml-2 text-xs font-medium",
                            analytics.responseTimes.trend === 'improving' ? 'text-emerald-600' : 
                            analytics.responseTimes.trend === 'declining' ? 'text-red-600' : 'text-gray-600'
                          )}>
                            {analytics.responseTimes.trend === 'improving' ? '↓' : 
                            analytics.responseTimes.trend === 'declining' ? '↑' : '→'}
                          </span>
                        </p>
                      </div>
                      <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                          <Package className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                          <p className="text-xs sm:text-sm font-medium text-gray-900">Food Types</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {analytics.foodTypeDistribution.slice(0, 2).map((item) => (
                            <Badge 
                              key={item.type}
                              variant="outline"
                              className="text-xs bg-white text-gray-700 border-gray-300"
                            >
                              {item.type}: {item.percentage}%
                            </Badge>
                          ))}
                          {analytics.foodTypeDistribution.length > 2 && (
                            <Badge variant="outline" className="text-xs bg-white text-gray-500 border-gray-300">
                              +{analytics.foodTypeDistribution.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>
            {/* Recent Listings */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-gray-900 text-lg sm:text-xl">
                  <Package className="h-5 w-5 text-emerald-600" />
                  Recent Listings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
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
                    {/* Two listings side by side on larger screens, one on mobile */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recentListings.slice(currentIndex, currentIndex + (window.innerWidth < 768 ? 1 : 2)).map((listing) =>  (
                        <div
                          key={listing._id}
                          className="rounded-lg border border-gray-200 bg-white hover:shadow-md transition-all duration-200 overflow-hidden"
                        >
                          {/* Image Section */}
                          <div className="relative h-40 sm:h-48 w-full overflow-hidden">
                            {listing.images && listing.images.length > 0 ? (
                              <img
                                src={listing.images[0]}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <Package className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* Listing Details */}
                          <div className="p-3 sm:p-4">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2">
                              <h4 className="font-medium text-gray-900 text-sm sm:text-base">{listing.title}</h4>
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
                            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 text-xs sm:text-sm text-gray-600">
                              <div className="flex flex-wrap gap-1">
                                {listing.types.slice(0, 2).map(type => getFoodTypeBadge(type))}
                                {listing.types.length > 2 && (
                                  <Badge variant="outline" className="text-xs bg-white text-gray-500 border-gray-300">
                                    +{listing.types.length - 2} more
                                  </Badge>
                                )}
                              </div>
                              <span className="flex items-center gap-1">
                                {getFreshnessIcon(listing.freshness)}
                                {listing.quantity} {listing.unit}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="truncate max-w-[120px] sm:max-w-[150px]">{listing.location.address}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                {new Date(listing.availableUntil).toLocaleDateString()}
                              </span>
                            </div>
                            {listing.interestedUsers && (
                              <p className="text-xs sm:text-sm text-emerald-700 font-medium mt-2">
                                {listing.interestedUsers} interested
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Navigation Controls */}
                    {recentListings.length > (window.innerWidth < 768 ? 1 : 2) && (
                      <div className="flex justify-center gap-4 mt-6 mb-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm h-8 w-8 sm:h-10 sm:w-10"
                          onClick={() => setCurrentIndex(prev => Math.max(prev - (window.innerWidth < 768 ? 1 : 2), 0))}
                          disabled={currentIndex === 0}
                        >
                          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm h-8 w-8 sm:h-10 sm:w-10"
                          onClick={() => setCurrentIndex(prev => Math.min(prev + (window.innerWidth < 768 ? 1 : 2), recentListings.length - (window.innerWidth < 768 ? 1 : 2)))}
                          disabled={currentIndex >= recentListings.length - (window.innerWidth < 768 ? 1 : 2)}
                        >
                          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
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
                      className="mt-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 text-sm"
                    >
                      Create your first listing
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Mobile Menu */}
          <div className={cn(
            "fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto h-full pb-20">
              <SidebarContent />
            </div>
          </div>

          {/* Right Column - Desktop */}
          <div className="hidden lg:block w-full lg:w-80 xl:w-96 space-y-6">
            <SidebarContent />
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

// Extracted sidebar content for reuse
function SidebarContent() {
  const router = useRouter()
  const { notifications, unreadCount } = useNotifications()
  const [stats, setStats] = useState<StatsData | null>(null)
  
  useEffect(() => {
    // Fetch stats if needed
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) return

        const response = await fetch('/api/listings/stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const statsData = await response.json()
          setStats(statsData)
        }
      } catch (err) {
        console.error('Error fetching stats for sidebar:', err)
      }
    }

    fetchStats()
  }, [])

  return (
    <>
      {/* Quick Actions */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-gray-900 text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-3">
          <Button
            onClick={() => router.push("/dashboard/donor/list-food")}
            className="w-full justify-start bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 text-sm"
            size="lg"
          >
            <Plus className="h-4 w-4 mr-3" />
            List Surplus Food
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm text-sm"
            onClick={() => router.push('/dashboard/donor/calendar-integration')}
          >
            <Calendar className="h-4 w-4 mr-3" />
            Calendar Integration
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm text-sm"
          >
            <TrendingUp className="h-4 w-4 mr-3" />
            Impact Report
          </Button>
        </CardContent>
      </Card>

      {/* Notifications Card */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
              <AlertCircle className="h-5 w-5 text-emerald-600" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </CardTitle>
            <Link href="/dashboard/donor/notifications">
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
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
                <p className="text-sm">No notifications yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {stats && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-gray-900 text-lg">Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Active Listings</span>
              <span className="font-semibold text-emerald-700 text-sm">{stats.activeListings}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Completed Pickups</span>
              <span className="font-semibold text-emerald-700 text-sm">{stats.completedPickups}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Avg Response Time</span>
              <span className="font-semibold text-emerald-700 text-sm">{stats.avgResponseTime}m</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Success Rate</span>
              <span className="font-semibold text-emerald-700 text-sm">94%</span>
            </div>
          </CardContent>
        </Card>
      )}
    </>
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
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="text-emerald-600 p-1 sm:p-2 bg-emerald-100 rounded-full">{icon}</div>
          <div
            className={cn(
              "flex items-center gap-1 text-xs sm:text-sm font-medium",
              trend === "up" ? "text-emerald-600" : "text-red-600",
            )}
          >
            {trend === "up" ? <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4" /> : <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4" />}
            {change}
          </div>
        </div>
        <div className="mt-3 sm:mt-4">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{value}</h3>
          <p className="text-xs sm:text-sm text-gray-600">{title}</p>
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