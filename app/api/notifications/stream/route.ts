//app/api/notifications/stream/route.ts
import { NextResponse } from 'next/server'
import { verifyTokenForSSE } from '@/lib/auth'
import connectToDB from '@/lib/db'
import NotificationModel from '@/lib/models/Notification'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await connectToDB()
    
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    if (!token) {
      return new NextResponse('Token required', { status: 401 })
    }

    const decoded = verifyTokenForSSE(token)
    if (!decoded?.userId) {
      return new NextResponse('Invalid token', { status: 401 })
    }

    const userId = new mongoose.Types.ObjectId(decoded.userId)

    const stream = new ReadableStream({
      async start(controller) {
        console.log(`New SSE connection for user: ${decoded.userId}`)
        
        // Send heartbeat every 25 seconds
        const heartbeatInterval = setInterval(() => {
          controller.enqueue(': heartbeat\n\n')
        }, 25000)

        // Send initial unread notifications
        const initialNotifications = await NotificationModel.find({
          userId: userId,
          read: false
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('listingId', 'title imageUrl')
        .lean()

        controller.enqueue(`data: ${JSON.stringify({
          type: 'INITIAL',
          notifications: initialNotifications
        })}\n\n`)

        // Watch for new notifications
        const changeStream = NotificationModel.watch(
          [{
            $match: {
              'fullDocument.userId': userId,
              operationType: 'insert'
            }
          }],
          { 
            fullDocument: 'updateLookup',
            batchSize: 1
          }
        )

        changeStream.on('change', async (change) => {
          if (change.operationType === 'insert') {
            const notification = change.fullDocument
            const populated = await NotificationModel.populate(notification, {
              path: 'listingId',
              select: 'title imageUrl'
            })
            
            controller.enqueue(`data: ${JSON.stringify({
              type: 'NEW_NOTIFICATION',
              notification: populated
            })}\n\n`)
          }
        })

        changeStream.on('error', (error) => {
          console.error('Change stream error:', error)
          clearInterval(heartbeatInterval)
          controller.close()
        })

        // Cleanup on disconnect
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval)
          changeStream.close()
          controller.close()
        })
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (error) {
    console.error('SSE connection error:', error)
    return new NextResponse('SSE connection failed', { status: 500 })
  }
}