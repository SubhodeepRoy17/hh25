// app/dashboard/donor/notifications/page.tsx
// app/dashboard/donor/notifications/page.tsx
"use client"

import { useNotifications } from '@/context/NotificationsContext'
import { Bell, ChevronLeft, Filter, CheckCircle2, Clock, Users, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { NotificationType } from "@/lib/models/Notification"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread" | "urgent">("all")
  const { 
    notifications, 
    unreadCount, 
    loading,
    markAsRead, 
    fetchNotifications,
    markAllAsRead 
  } = useNotifications()
  const { toast } = useToast()

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") return !notification.read
    if (filter === "urgent") return notification.urgent
    return true
  })

  const handleNotificationClick = async (id: string) => {
    try {
      await markAsRead(id)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive"
      })
    }
  }

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

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "expiring_soon":
        return <Clock className="h-5 w-5" />
      case "completed":
        return <CheckCircle2 className="h-5 w-5" />
      case "new_listing":
        return <Bell className="h-5 w-5" />
      case "claim":
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-8 w-48 rounded-md" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
            <div className="space-y-4">
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/donor">
            <Button
              variant="outline"
              size="icon"
              className="border-slate-600/50 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white">Notifications</h1>
          {unreadCount > 0 && (
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 backdrop-blur-sm">
              {unreadCount} unread
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Filter className="h-5 w-5 text-emerald-400" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant={filter === "all" ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start text-white",
                      filter === "all"
                        ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                        : "hover:bg-slate-700/50",
                    )}
                    onClick={() => setFilter("all")}
                  >
                    All Notifications
                  </Button>
                  <Button
                    variant={filter === "unread" ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start text-white",
                      filter === "unread"
                        ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                        : "hover:bg-slate-700/50",
                    )}
                    onClick={() => setFilter("unread")}
                  >
                    Unread Only
                  </Button>
                  <Button
                    variant={filter === "urgent" ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start text-white",
                      filter === "urgent"
                        ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                        : "hover:bg-slate-700/50",
                    )}
                    onClick={() => setFilter("urgent")}
                  >
                    Urgent Only
                  </Button>
                  {unreadCount > 0 && (
                    <Button
                      variant="outline"
                      className="w-full justify-start mt-4 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 bg-emerald-500/5"
                      onClick={handleMarkAllAsRead}
                    >
                      Mark All as Read
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Bell className="h-5 w-5 text-emerald-400" />
                  {filter === "all" && "All Notifications"}
                  {filter === "unread" && "Unread Notifications"}
                  {filter === "urgent" && "Urgent Notifications"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredNotifications.length > 0 ? (
                  <div className="space-y-3">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification._id}
                        className={cn(
                          "p-4 rounded-lg border transition-all duration-200 cursor-pointer backdrop-blur-sm",
                          !notification.read &&
                            "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 shadow-lg shadow-emerald-500/10",
                          notification.read && "border-slate-600/30 bg-slate-700/30 hover:bg-slate-700/50",
                          notification.urgent &&
                            "border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 shadow-lg shadow-orange-500/10",
                        )}
                        onClick={() => handleNotificationClick(notification._id)}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "p-2 rounded-full backdrop-blur-sm",
                              notification.type === "expiring" && "bg-orange-500/20 text-orange-300",
                              notification.type === "completed" && "bg-blue-500/20 text-blue-300",
                              notification.type === "new_listing" && "bg-emerald-500/20 text-emerald-300",
                              notification.type === "claim" && "bg-red-500/20 text-red-300",
                            )}
                          >
                            {getNotificationIcon(notification.type as NotificationType)}
                          </div>
                          <div className="flex-1">
                            <p
                              className={cn(
                                "font-medium",
                                !notification.read && "text-white",
                                notification.read && "text-slate-300",
                              )}
                            >
                              {notification.message}
                            </p>
                            <p className="text-sm text-slate-400 mt-1">{formatDate(notification.createdAt)}</p>
                          </div>
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-emerald-400 mt-2 shadow-sm shadow-emerald-400/50" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Bell className="h-10 w-10 mx-auto mb-4 text-slate-500" />
                    <p className="text-slate-300">No notifications found</p>
                    <p className="text-sm mt-1">You're all caught up!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}