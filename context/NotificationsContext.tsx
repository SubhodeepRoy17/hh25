// context/NotificationsContext.tsx
"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { useAuth } from "./AuthContext"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { ToastAction } from "@radix-ui/react-toast"

export type NotificationType = "pickup" | "expiring" | "completed" | "new_listing" | "claim"

export interface Notification {
  _id: string
  userId: string
  listingId?: string
  type: NotificationType
  message: string
  urgent: boolean
  read: boolean
  metadata?: Record<string, any>
  createdAt: string | Date
}

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  markAsRead: (id: string) => Promise<void>
  fetchNotifications: () => Promise<void>
  markAllAsRead: () => Promise<void>
  sendNotification: (notification: Omit<Notification, '_id' | 'createdAt' | 'read'>) => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const eventSourceRef = useRef<EventSource | null>(null)

  const setupPushNotifications = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !user) return

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(subscription)
      })
    } catch (error) {
      console.error('Push registration failed:', error)
    }
  }, [user])

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch notifications')
      
      const data = await response.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }, [user])

  const markAsRead = useCallback(async (id: string) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) throw new Error('Failed to mark notification as read')
      
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
      setError(error instanceof Error ? error.message : 'Failed to mark notification as read')
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) throw new Error('Failed to mark all as read')
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      setError(error instanceof Error ? error.message : 'Failed to mark all as read')
    }
  }, [])

  const sendNotification = useCallback(async (notification: Omit<Notification, '_id' | 'createdAt' | 'read'>) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notification)
      })
      
      if (!response.ok) throw new Error('Failed to send notification')
      
      return await response.json()
    } catch (error) {
      console.error('Error sending notification:', error)
      throw error
    }
  }, [])

  const setupEventSource = useCallback(() => {
    if (!user) return

    const token = localStorage.getItem('authToken')
    if (!token) return

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const encodedToken = encodeURIComponent(token)
    const eventSource = new EventSource(`/api/notifications/stream?token=${encodedToken}`)
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'INITIAL') {
          setNotifications(prev => [...data.notifications, ...prev])
          setUnreadCount(prev => prev + data.notifications.filter((n: Notification) => !n.read).length)
        } 
        else if (data.type === 'NEW_NOTIFICATION') {
          const newNotification = data.notification
          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(prev => prev + (newNotification.read ? 0 : 1))
          
          // In your notification context where you show the toast:
          if (newNotification.userId === user?.userId) {
            toast({
              title: "New Notification",
              description: newNotification.message,
              variant: newNotification.urgent ? "destructive" : "default",
              action: newNotification.listingId ? (
                <ToastAction 
                  altText="View listing" 
                  onClick={() => router.push(`/listings/${newNotification.listingId}`)}
                >
                  View
                </ToastAction>
              ) : undefined
            })
          }
        }
      } catch (error) {
        console.error('Error processing SSE message:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE error:', error)
      // Reconnect after 5 seconds if connection drops
      setTimeout(() => setupEventSource(), 5000)
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [user, toast, router])

  useEffect(() => {
    if (user) {
      fetchNotifications()
      setupPushNotifications()
      setupEventSource()
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [user, fetchNotifications, setupPushNotifications, setupEventSource])

  return (
    <NotificationsContext.Provider 
      value={{ 
        notifications, 
        unreadCount,
        loading,
        error,
        markAsRead,
        fetchNotifications,
        markAllAsRead,
        sendNotification
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
}