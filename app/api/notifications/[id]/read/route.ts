// ./app/api/notifications/[id]/read/route.ts
import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import NotificationModel from "@/lib/models/Notification"
import { auth } from "@/lib/auth"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    // Pass the request object to auth()
    const session = await auth(request)
    
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the notification belongs to the authenticated user
    const notification = await NotificationModel.findOne({
      _id: params.id,
      userId: session.userId
    })

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    // Update the notification
    const updatedNotification = await NotificationModel.findByIdAndUpdate(
      params.id,
      { read: true },
      { new: true }
    )

    return NextResponse.json({ notification: updatedNotification })
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}