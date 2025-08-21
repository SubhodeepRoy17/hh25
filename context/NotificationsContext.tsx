//context/NotificationsContext.tsx
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
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
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

  const setupEventSource = useCallback(() => {
    if (!user) {
      console.log('SSE: No user, skipping setup')
      return
    }

    const token = localStorage.getItem('authToken')
    if (!token) {
      console.error('SSE: No auth token available')
      return
    }

    // Clear any existing connection and retry timeout
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }

    console.log('SSE: Establishing new connection')
    const eventSource = new EventSource(`/api/notifications/stream?token=${encodeURIComponent(token)}`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('SSE: Connection established')
      // Reset retry count on successful connection
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
    }

    eventSource.onmessage = (event) => {
      try {
        if (event.data === ': heartbeat') return
        
        const data = JSON.parse(event.data)
        
        if (data.type === 'INITIAL') {
          console.log('SSE: Received initial notifications', data.notifications.length)
          setNotifications(data.notifications)
          setUnreadCount(data.notifications.filter((n: Notification) => !n.read).length)
        } 
        else if (data.type === 'NEW_NOTIFICATION') {
          console.log('SSE: New notification received', data.notification._id)
          const newNotification = data.notification
          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(prev => prev + 1)
          
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
      } catch (error) {
        console.error('SSE: Error processing message:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE: Connection error:', error)
      
      // Close the current connection
      eventSource.close()
      eventSourceRef.current = null
      
      // Implement exponential backoff for reconnection
      const retryCount = retryTimeoutRef.current ? parseInt(localStorage.getItem('sseRetryCount') || '0') : 0
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000) // Max 30 seconds

      console.log(`SSE: Will attempt reconnection in ${delay}ms (attempt ${retryCount + 1})`)
      localStorage.setItem('sseRetryCount', (retryCount + 1).toString())

      retryTimeoutRef.current = setTimeout(() => {
        console.log('SSE: Attempting reconnection...')
        setupEventSource()
      }, delay)
    }

    return () => {
      console.log('SSE: Cleaning up connection')
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
    }
  }, [user, toast, router])

  useEffect(() => {
    if (user) {
      console.log('Notifications: User detected, initializing')
      fetchNotifications()
      setupEventSource()
    } else {
      console.log('Notifications: No user, skipping initialization')
    }

    return () => {
      console.log('Notifications: Component unmounting, cleaning up')
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
    }
  }, [user, fetchNotifications, setupEventSource])

  return (
    <NotificationsContext.Provider 
      value={{ 
        notifications, 
        unreadCount,
        loading,
        error,
        markAsRead,
        fetchNotifications,
        markAllAsRead
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
