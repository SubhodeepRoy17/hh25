import { NextResponse } from 'next/server'
import { verifyTokenForSSE } from '@/lib/auth'
import connectToDB from '@/lib/db'
import NotificationModel from '@/lib/models/Notification'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await connectToDB()
    
    // Get token from query params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    if (!token) {
      return new NextResponse('Token required', { status: 401 })
    }

    // Verify token specifically for SSE
    const decoded = verifyTokenForSSE(token)
    if (!decoded) {
      return new NextResponse('Invalid token', { status: 401 })
    }

    // Create SSE response
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial data
        const initialNotifications = await NotificationModel.find({
          userId: decoded.userId,
          read: false
        }).sort({ createdAt: -1 }).limit(10).lean()

        const initialData = JSON.stringify({
          type: 'INITIAL',
          notifications: initialNotifications
        })
        controller.enqueue(`data: ${initialData}\n\n`)

        // Watch for new notifications
        const changeStream = NotificationModel.watch(
          [
            {
              $match: {
                'fullDocument.userId': decoded.userId,
                operationType: 'insert'
              }
            }
          ],
          { fullDocument: 'updateLookup' }
        )

        changeStream.on('change', async (change) => {
          if (change.operationType === 'insert') {
            const newNotification = change.fullDocument
            const data = JSON.stringify({
              type: 'NEW_NOTIFICATION',
              notification: newNotification
            })
            controller.enqueue(`data: ${data}\n\n`)
          }
        })

        // Handle client disconnect
        const handleClose = () => {
          changeStream.close()
          controller.close()
        }

        // Listen for abort event (client disconnect)
        const abortController = new AbortController()
        abortController.signal.addEventListener('abort', handleClose)

        return () => {
          abortController.abort()
        }
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
    if (error instanceof Error && error.message.includes('Token')) {
      return new NextResponse(error.message, { status: 401 })
    }
    return new NextResponse('SSE connection failed', { status: 500 })
  }
}