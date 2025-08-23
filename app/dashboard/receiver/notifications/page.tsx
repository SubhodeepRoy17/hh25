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
        return "bg-amber-500/20 text-amber-300"
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
      <main className="min-h-screen bg-gradient-to-br from-background via-card/30 to-background text-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-8 w-48 mb-2 rounded-lg" />
              <Skeleton className="h-4 w-32 rounded-lg" />
            </div>
          </div>
          <div className="grid lg:grid-cols-[320px_1fr] gap-8">
            <Skeleton className="h-96 w-full rounded-xl" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-card/30 to-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-primary/30 bg-card hover:bg-primary/10 text-primary font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold">Your Notifications</h1>
            <p className="text-muted-foreground text-lg">
              {unreadCount > 0 ? `${unreadCount} new updates waiting for you` : "You're all caught up! 🎉"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              Mark All Read
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-[320px_1fr] gap-8">
          {/* Filters Sidebar */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Filter className="h-5 w-5 text-primary" />
                Filter Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-semibold text-foreground mb-3 block">Notification Type</label>
                <div className="space-y-2">
                  {[
                    { key: "all", label: "All notifications", count: notifications.length },
                    {
                      key: "new_listing",
                      label: "New food available",
                      count: notifications.filter((n) => n.type === "new_listing").length,
                    },
                    {
                      key: "claim",
                      label: "Claim updates",
                      count: notifications.filter((n) => n.type === "claim").length,
                    },
                    {
                      key: "pickup",
                      label: "Pickup reminders",
                      count: notifications.filter((n) => n.type === "pickup").length,
                    },
                    {
                      key: "completed",
                      label: "Completed pickups",
                      count: notifications.filter((n) => n.type === "completed").length,
                    },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setFilter(item.key as any)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-lg text-sm transition-all flex items-center justify-between font-medium",
                        filter === item.key
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      )}
                    >
                      <span>{item.label}</span>
                      <Badge
                        className={cn(
                          "text-xs font-semibold",
                          filter === item.key
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-primary/10 text-primary",
                        )}
                      >
                        {item.count}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/50 pt-4">
                <label className="flex items-center gap-3 text-sm font-medium text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showUnreadOnly}
                    onChange={(e) => setShowUnreadOnly(e.target.checked)}
                    className="rounded border-border bg-background text-primary focus:ring-primary/50 w-4 h-4"
                  />
                  Show unread only
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
                <CardContent className="p-12 text-center">
                  <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No notifications found</h3>
                  <p className="text-muted-foreground">Try adjusting your filters or check back later for updates.</p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <Card
                  key={notification._id}
                  className={cn(
                    "bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-200 cursor-pointer",
                    notification.urgent && "border-accent/50 bg-accent/5",
                    !notification.read && "ring-2 ring-primary/20 border-primary/30",
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
                      <div className={cn("p-3 rounded-xl", getNotificationColor(notification.type))}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-foreground text-lg">
                            {notification.type === "new_listing" && "🍎 New Food Available"}
                            {notification.type === "claim" && "📋 Claim Update"}
                            {notification.type === "pickup" && "📍 Pickup Scheduled"}
                            {notification.type === "completed" && "✅ Pickup Completed"}
                          </h3>
                          <div className="flex items-center gap-2">
                            {notification.urgent && (
                              <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-xs font-semibold">
                                Urgent
                              </Badge>
                            )}
                            {!notification.read && <div className="w-3 h-3 bg-primary rounded-full" />}
                          </div>
                        </div>
                        <p className="text-muted-foreground mb-4 leading-relaxed">{notification.message}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground font-medium">
                            {formatTime(notification.createdAt)}
                          </p>
                          {notification.listingId && (
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/listings/${notification.listingId}`)
                              }}
                            >
                              View Details
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