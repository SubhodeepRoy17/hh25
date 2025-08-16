// app/dashboard/receiver/notifications/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bell, AlertCircle, CheckCircle2, Timer, Coins, Package, Settings, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/context/NotificationsContext"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"

export default function NotificationsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<"all" | "new_listing" | "claim" | "pickup" | "completed">("all")
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const { 
    notifications, 
    unreadCount, 
    loading,
    markAsRead,
    markAllAsRead
  } = useNotifications()
  const { toast } = useToast()

  const filteredNotifications = notifications.filter((notification) => {
    const matchesType = filter === "all" || notification.type === filter
    const matchesRead = !showUnreadOnly || !notification.read
    return matchesType && matchesRead
  })

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      toast({
        title: "Success",
        description: "All notifications marked as read",
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive"
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_listing":
        return <AlertCircle className="h-5 w-5" />
      case "claim":
        return <Timer className="h-5 w-5" />
      case "pickup":
        return <CheckCircle2 className="h-5 w-5" />
      case "completed":
        return <Package className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "new_listing":
        return "bg-emerald-500/20 text-emerald-300"
      case "claim":
        return "bg-yellow-500/20 text-yellow-300"
      case "pickup":
        return "bg-blue-500/20 text-blue-300"
      case "completed":
        return "bg-purple-500/20 text-purple-300"
      default:
        return "bg-gray-500/20 text-gray-300"
    }
  }

  const formatTime = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - d.getTime()) / (1000 * 60))
      return `${diffInMinutes} minutes ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} days ago`
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-10 w-24" />
            <div className="flex-1">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid lg:grid-cols-[300px_1fr] gap-6">
            <Skeleton className="h-96 w-full" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-emerald-500/40 bg-transparent text-emerald-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold">Notifications</h1>
            <p className="text-gray-300 text-sm">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Mark all read
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-6">
          {/* Filters Sidebar */}
          <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Filter className="h-5 w-5 text-emerald-300" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Type</label>
                <div className="space-y-2">
                  {[
                    { key: "all", label: "All notifications", count: notifications.length },
                    {
                      key: "new_listing",
                      label: "New listings",
                      count: notifications.filter((n) => n.type === "new_listing").length,
                    },
                    {
                      key: "claim",
                      label: "Claim updates",
                      count: notifications.filter((n) => n.type === "claim").length,
                    },
                    {
                      key: "pickup",
                      label: "Pickup updates",
                      count: notifications.filter((n) => n.type === "pickup").length,
                    },
                    {
                      key: "completed",
                      label: "Completed",
                      count: notifications.filter((n) => n.type === "completed").length,
                    },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setFilter(item.key as any)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between",
                        filter === item.key
                          ? "bg-emerald-500/20 text-emerald-100 border border-emerald-500/30"
                          : "text-gray-300 hover:text-gray-100 hover:bg-gray-800/50",
                      )}
                    >
                      <span>{item.label}</span>
                      <Badge className="bg-gray-700 text-gray-200 text-xs">{item.count}</Badge>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-800 pt-4">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={showUnreadOnly}
                    onChange={(e) => setShowUnreadOnly(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500"
                  />
                  Show unread only
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800">
                <CardContent className="p-8 text-center">
                  <Bell className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">No notifications found</h3>
                  <p className="text-gray-500">Try adjusting your filters or check back later.</p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <Card
                  key={notification._id}
                  className={cn(
                    "bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800 transition-colors",
                    notification.urgent && "border-yellow-500/30 bg-yellow-500/5",
                    !notification.read && "ring-1 ring-emerald-500/20",
                  )}
                  onClick={() => {
                    markAsRead(notification._id)
                    if (notification.listingId) {
                      router.push(`/listings/${notification.listingId}`)
                    }
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={cn("p-2 rounded-full", getNotificationColor(notification.type))}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-white">
                            {notification.type === "new_listing" && "New Food Available"}
                            {notification.type === "claim" && "Claim Update"}
                            {notification.type === "pickup" && "Pickup Scheduled"}
                            {notification.type === "completed" && "Pickup Completed"}
                          </h3>
                          <div className="flex items-center gap-2">
                            {notification.urgent && (
                              <Badge className="bg-red-500/20 text-red-100 border-red-500/30 text-xs">Urgent</Badge>
                            )}
                            {!notification.read && <div className="w-2 h-2 bg-emerald-400 rounded-full" />}
                          </div>
                        </div>
                        <p className="text-gray-300 mb-3">{notification.message}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500">{formatTime(notification.createdAt)}</p>
                          {notification.listingId && (
                            <Button 
                              size="sm" 
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/listings/${notification.listingId}`)
                              }}
                            >
                              View Listing
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  )
}