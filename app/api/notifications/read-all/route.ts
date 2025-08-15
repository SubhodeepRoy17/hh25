// ./app/api/notifications/read-all/route.ts
import { NextResponse } from "next/server"
import connectToDB from "@/lib/db"
import NotificationModel from "@/lib/models/Notification"
import { auth } from "@/lib/auth"

export async function PATCH() {
  try {
    await connectToDB()
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await NotificationModel.updateMany(
      { userId: session.user.id, read: false },
      { $set: { read: true } }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to mark all notifications as read" },
      { status: 500 }
    )
  }
}