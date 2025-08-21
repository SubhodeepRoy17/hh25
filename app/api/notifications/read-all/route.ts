import { NextResponse } from "next/server"
import connectToDB from "@/lib/db"
import NotificationModel from "@/lib/models/Notification"
import { auth } from "@/lib/auth"

export async function PATCH(request: Request) {
  try {
    await connectToDB()
    const session = await auth(request) // Add the request parameter
    
    if (!session?.userId) { // Use session.userId instead of session.user.id
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await NotificationModel.updateMany(
      { userId: session.userId, read: false }, // Use session.userId
      { $set: { read: true } }
    )

    return NextResponse.json({ 
      success: true,
      modifiedCount: result.modifiedCount 
    })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return NextResponse.json(
      { error: "Failed to mark all notifications as read" },
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