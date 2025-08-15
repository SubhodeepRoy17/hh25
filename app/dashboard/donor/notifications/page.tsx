//app/dashboard/donor/notifications/page.tsx
"use client"

import { useNotifications } from '@/context/NotificationsContext'
import { Bell, ChevronLeft, Filter, CheckCircle2, Clock, Users } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { NotificationType } from "@/lib/models/Notification"
import { useToast } from "@/components/ui/use-toast"

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread" | "urgent">("all")
  const { 
    notifications, 
    unreadCount, 
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
      console.error("Failed to mark notification as read:", error)
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
      console.error("Failed to mark all notifications as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive"
      })
    }
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "pickup":
        return <Users className="h-5 w-5" />
      case "expiring":
        return <Clock className="h-5 w-5" />
      case "completed":
        return <CheckCircle2 className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const formatDate = (date: string | Date) => {
    if (typeof date === 'string') {
      return new Date(date).toLocaleString()
    }
    return date.toLocaleString()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/donor">
          <Button variant="outline" size="icon" className="border-gray-700">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        {unreadCount > 0 && (
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            {unreadCount} unread
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-emerald-400" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant={filter === "all" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setFilter("all")}
                >
                  All Notifications
                </Button>
                <Button
                  variant={filter === "unread" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setFilter("unread")}
                >
                  Unread Only
                </Button>
                <Button
                  variant={filter === "urgent" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setFilter("urgent")}
                >
                  Urgent Only
                </Button>
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    className="w-full justify-start mt-4 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
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
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
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
                        "p-4 rounded-lg border transition-colors cursor-pointer",
                        !notification.read && "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20",
                        notification.read && "border-gray-800 bg-gray-800/30 hover:bg-gray-800/50",
                        notification.urgent && "border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20"
                      )}
                      onClick={() => handleNotificationClick(notification._id)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "p-2 rounded-full",
                            notification.type === "pickup" && "bg-emerald-500/20 text-emerald-300",
                            notification.type === "expiring" && "bg-yellow-500/20 text-yellow-300",
                            notification.type === "completed" && "bg-blue-500/20 text-blue-300",
                          )}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <p className={cn(
                            "font-medium",
                            !notification.read && "text-white",
                            notification.read && "text-gray-300"
                          )}>
                            {notification.message}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-emerald-400 mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Bell className="h-10 w-10 mx-auto mb-4" />
                  <p>No notifications found</p>
                  <p className="text-sm mt-1">You're all caught up!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}