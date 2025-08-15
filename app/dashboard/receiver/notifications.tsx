"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bell, AlertCircle, CheckCircle2, Timer, Coins, Package, Settings, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

// Extended mock notifications data
const mockNotifications = [
  {
    id: 1,
    type: "new_match",
    title: "New vegetarian meals available",
    message: "60 hot meals at Main Campus Canteen - 0.8km away. Matches your preferences!",
    time: "2024-01-15T16:30:00",
    urgent: true,
    read: false,
    actionable: true,
  },
  {
    id: 2,
    type: "pickup_reminder",
    title: "Pickup reminder",
    message: "Don't forget to collect your claimed produce at Market Square by 8 PM today",
    time: "2024-01-15T15:30:00",
    urgent: false,
    read: false,
    actionable: true,
  },
  {
    id: 3,
    type: "tokens_earned",
    title: "Tokens earned!",
    message: "You earned 15 tokens for completing yesterday's pickup at Student Center",
    time: "2024-01-15T14:00:00",
    urgent: false,
    read: true,
    actionable: false,
  },
  {
    id: 4,
    type: "pickup_confirmed",
    title: "Pickup confirmed",
    message: "CommunityBite confirmed your pickup for fresh produce. See you at 6 PM!",
    time: "2024-01-15T12:15:00",
    urgent: false,
    read: true,
    actionable: false,
  },
  {
    id: 5,
    type: "new_match",
    title: "Bakery items nearby",
    message: "40 fresh bakery items at Student Center Cafe - 0.5km away",
    time: "2024-01-15T11:45:00",
    urgent: false,
    read: true,
    actionable: false,
  },
  {
    id: 6,
    type: "system",
    title: "Profile updated",
    message: "Your food preferences have been updated successfully",
    time: "2024-01-15T10:30:00",
    urgent: false,
    read: true,
    actionable: false,
  },
  {
    id: 7,
    type: "pickup_completed",
    title: "Pickup completed",
    message: "Thank you for collecting 25kg of produce! You've helped reduce food waste.",
    time: "2024-01-14T18:00:00",
    urgent: false,
    read: true,
    actionable: false,
  },
  {
    id: 8,
    type: "tokens_earned",
    title: "Bonus tokens!",
    message: "You earned 25 bonus tokens for your 10th successful pickup this month!",
    time: "2024-01-14T17:30:00",
    urgent: false,
    read: true,
    actionable: false,
  },
]

type NotificationType =
  | "all"
  | "new_match"
  | "pickup_reminder"
  | "tokens_earned"
  | "pickup_confirmed"
  | "system"
  | "pickup_completed"

export default function NotificationsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<NotificationType>("all")
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const filteredNotifications = mockNotifications.filter((notification) => {
    const matchesType = filter === "all" || notification.type === filter
    const matchesRead = !showUnreadOnly || !notification.read
    return matchesType && matchesRead
  })

  const unreadCount = mockNotifications.filter((n) => !n.read).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_match":
        return <AlertCircle className="h-5 w-5" />
      case "pickup_reminder":
        return <Timer className="h-5 w-5" />
      case "tokens_earned":
        return <Coins className="h-5 w-5" />
      case "pickup_confirmed":
        return <CheckCircle2 className="h-5 w-5" />
      case "pickup_completed":
        return <Package className="h-5 w-5" />
      case "system":
        return <Settings className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "new_match":
        return "bg-emerald-500/20 text-emerald-300"
      case "pickup_reminder":
        return "bg-yellow-500/20 text-yellow-300"
      case "tokens_earned":
        return "bg-blue-500/20 text-blue-300"
      case "pickup_confirmed":
        return "bg-green-500/20 text-green-300"
      case "pickup_completed":
        return "bg-purple-500/20 text-purple-300"
      case "system":
        return "bg-gray-500/20 text-gray-300"
      default:
        return "bg-gray-500/20 text-gray-300"
    }
  }

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `${diffInMinutes} minutes ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} days ago`
    }
  }

  const markAllAsRead = () => {
    // In real app, this would make an API call
    alert("All notifications marked as read!")
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
            <Button onClick={markAllAsRead} className="bg-emerald-600 hover:bg-emerald-700 text-white">
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
                    { key: "all", label: "All notifications", count: mockNotifications.length },
                    {
                      key: "new_match",
                      label: "New matches",
                      count: mockNotifications.filter((n) => n.type === "new_match").length,
                    },
                    {
                      key: "pickup_reminder",
                      label: "Pickup reminders",
                      count: mockNotifications.filter((n) => n.type === "pickup_reminder").length,
                    },
                    {
                      key: "tokens_earned",
                      label: "Tokens earned",
                      count: mockNotifications.filter((n) => n.type === "tokens_earned").length,
                    },
                    {
                      key: "pickup_confirmed",
                      label: "Pickup confirmed",
                      count: mockNotifications.filter((n) => n.type === "pickup_confirmed").length,
                    },
                    {
                      key: "pickup_completed",
                      label: "Pickup completed",
                      count: mockNotifications.filter((n) => n.type === "pickup_completed").length,
                    },
                    {
                      key: "system",
                      label: "System",
                      count: mockNotifications.filter((n) => n.type === "system").length,
                    },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setFilter(item.key as NotificationType)}
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
                  key={notification.id}
                  className={cn(
                    "bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800 transition-colors",
                    notification.urgent && "border-yellow-500/30 bg-yellow-500/5",
                    !notification.read && "ring-1 ring-emerald-500/20",
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={cn("p-2 rounded-full", getNotificationColor(notification.type))}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-white">{notification.title}</h3>
                          <div className="flex items-center gap-2">
                            {notification.urgent && (
                              <Badge className="bg-red-500/20 text-red-100 border-red-500/30 text-xs">Urgent</Badge>
                            )}
                            {!notification.read && <div className="w-2 h-2 bg-emerald-400 rounded-full" />}
                          </div>
                        </div>
                        <p className="text-gray-300 mb-3">{notification.message}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500">{formatTime(notification.time)}</p>
                          {notification.actionable && (
                            <div className="flex gap-2">
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                Take Action
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-emerald-500/40 bg-transparent text-emerald-100"
                              >
                                Dismiss
                              </Button>
                            </div>
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
