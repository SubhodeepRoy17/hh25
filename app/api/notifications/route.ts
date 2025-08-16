// app/api/notifications/route.ts
import { NextResponse, NextRequest } from 'next/server'
import NotificationModel from "@/lib/models/Notification"
import { auth } from "@/lib/auth"
import connectToDB from '@/lib/db'
import webpush from 'web-push'
import NotificationSubcriptionModel from '@/lib/models/NotificationSubcriptionModel'

export const dynamic = 'force-dynamic'

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
        { status: 401 }
      )
    }

    const [notifications, unreadCount] = await Promise.all([
      NotificationModel.find({ userId: session.userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      NotificationModel.countDocuments({ 
        userId: session.userId,
        read: false
      })
    ])

    return NextResponse.json({ 
      notifications,
      unreadCount,
      pushSupported: !!process.env.NEXT_PUBLIC_VAPID_KEY 
    })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDB()
    
    const session = await auth(req)
    
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      )
    }

    const body = await req.json()
    const { userId, type, message, urgent, listingId, metadata } = body

    // Validate required fields
    if (!userId || !type || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create notification
    const notification = new NotificationModel({
      userId,
      type,
      message,
      urgent: urgent || false,
      listingId,
      metadata,
      read: false
    })

    await notification.save()

    // Send push notification if available
    try {
      const subscription = await NotificationSubcriptionModel.findOne({ userId })
      if (subscription) {
        await webpush.sendNotification(
          subscription.subscription,
          JSON.stringify({
            title: "New Notification",
            body: message,
            icon: "/placeholder-logo.png",
            data: { 
              url: listingId ? `/listings/${listingId}` : '/dashboard'
            }
          })
        )
      }
    } catch (error) {
      console.error('Failed to send push notification:', error)
    }

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Failed to create notification:', error)
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    )
  }
}