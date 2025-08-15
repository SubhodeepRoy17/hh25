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
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notification = await NotificationModel.findByIdAndUpdate(
      params.id,
      { read: true },
      { new: true }
    )

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json({ notification })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    )
  }
}