import { NextResponse, NextRequest } from 'next/server'
import NotificationModel from "@/lib/models/Notification"
import { auth } from "@/lib/auth"
import connectToDB from '@/lib/db'
import webpush from 'web-push'

export const dynamic = 'force-dynamic'

// Initialize webpush (moved here for better error handling)
try {
  webpush.setVapidDetails(
    `mailto:${process.env.NOTIFICATION_EMAIL}`,
    process.env.NEXT_PUBLIC_VAPID_KEY!,
    process.env.PRIVATE_VAPID_KEY!
  )
} catch (error) {
  console.error('Failed to initialize webpush:', error)
}

export async function GET(req: NextRequest) {
  try {
    await connectToDB()
    
    const session = await auth(req)
    
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { 
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer error="invalid_token"'
          }
        }
      )
    }

    const [notifications, unreadCount] = await Promise.all([
      NotificationModel.find({ userId: session.userId })
        .sort({ createdAt: -1 })
        .lean(),
      NotificationModel.countDocuments({ 
        userId: session.userId,
        read: false
      })
    ])

    return NextResponse.json(
      { 
        notifications,
        unreadCount,
        // Add push notification capability status
        pushSupported: !!process.env.NEXT_PUBLIC_VAPID_KEY 
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    )
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    
    return NextResponse.json(
      { 
        error: "Failed to fetch notifications",
        details: process.env.NODE_ENV === 'development' ? 
          error instanceof Error ? error.message : String(error)
          : undefined
      },
      { 
        status: 500,
        headers: {
          'Retry-After': '10'
        }
      }
    )
  }
}