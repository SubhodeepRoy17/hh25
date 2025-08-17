import { NextResponse } from 'next/server'
import { verifyTokenForSSE } from '@/lib/auth'
import connectToDB from '@/lib/db'
import NotificationModel from '@/lib/models/Notification'

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

    const stream = new ReadableStream({
      async start(controller) {
        console.log(`New SSE connection for user: ${decoded.userId}`)
        
        // Send heartbeat every 25 seconds
        const heartbeatInterval = setInterval(() => {
          controller.enqueue(': heartbeat\n\n')
        }, 25000)

        // Send initial notifications
        const initialNotifications = await NotificationModel.find({
          userId: decoded.userId,
          read: false
        }).sort({ createdAt: -1 }).limit(10).lean()

        controller.enqueue(`data: ${JSON.stringify({
          type: 'INITIAL',
          notifications: initialNotifications
        })}\n\n`)

        // Watch for new notifications
        const changeStream = NotificationModel.watch(
          [{
            $match: {
              'fullDocument.userId': decoded.userId,
              operationType: 'insert'
            }
          }],
          { 
            fullDocument: 'updateLookup',
            batchSize: 1
          }
        )

        changeStream.on('change', (change) => {
          if (change.operationType === 'insert') {
            console.log('New notification detected:', change.fullDocument._id)
            controller.enqueue(`data: ${JSON.stringify({
              type: 'NEW_NOTIFICATION',
              notification: change.fullDocument
            })}\n\n`)
          }
        })

        changeStream.on('error', (error) => {
          console.error('Change stream error:', error)
          clearInterval(heartbeatInterval)
          controller.close()
        })

        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          console.log('Client disconnected, cleaning up SSE')
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