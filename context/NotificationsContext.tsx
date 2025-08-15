// ./context/NotificationsContext.tsx
"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { useAuth } from "./AuthContext"
import { useToast } from "@/components/ui/use-toast"

export type NotificationType = "pickup" | "expiring" | "completed"

export interface Notification {
  _id: string
  userId: string
  listingId?: string
  type: NotificationType
  message: string
  urgent: boolean
  read: boolean
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
  const eventSourceRef = useRef<EventSource | null>(null)

  const setupPushNotifications = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !user) return;

    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(subscription)
      });
    } catch (error) {
      console.error('Push registration failed:', error);
    }
  }, [user]);

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

  useEffect(() => {
    if (user) {
      setupPushNotifications();
      setupEventSource(); // Your existing SSE setup
    }
  }, [user, setupPushNotifications]);

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
    if (!user) return

    const token = localStorage.getItem('authToken')
    if (!token) return

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    // URL encode the token for safety
    const encodedToken = encodeURIComponent(token)
    const eventSource = new EventSource(`/api/notifications/stream?token=${encodedToken}`)
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'INITIAL') {
          setNotifications(prev => [...data.notifications, ...prev])
          setUnreadCount(prev => prev + data.notifications.length)
        } 
        else if (data.type === 'NEW_NOTIFICATION') {
          setNotifications(prev => [data.notification, ...prev])
          setUnreadCount(prev => prev + 1)
          
          toast({
            title: "New Notification",
            description: data.notification.message,
            variant: data.notification.urgent ? "destructive" : "default"
          })
        }
      } catch (error) {
        console.error('Error processing SSE message:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE error:', error)
      // Only reconnect if it's not a 401 error
      if (!eventSourceRef.current?.url.includes('token')) {
        setTimeout(() => setupEventSource(), 5000)
      }
    }

    return () => {
      eventSource.close()
    }
  }, [user, toast])

  useEffect(() => {
    if (user) {
      fetchNotifications()
      setupEventSource()
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
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