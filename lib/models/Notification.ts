// lib/models/Notification.ts
import mongoose from 'mongoose'

export type NotificationType = "pickup" | "expiring" | "completed" | "new_listing" | "claim"

export interface INotification extends mongoose.Document {
  userId: mongoose.Schema.Types.ObjectId
  listingId?: mongoose.Schema.Types.ObjectId
  type: NotificationType
  message: string
  urgent: boolean
  read: boolean
  metadata?: Record<string, any>
  createdAt: Date
}

const NotificationSchema = new mongoose.Schema<INotification>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodListing'
  },
  type: {
    type: String,
    enum: ["pickup", "expiring", "completed", "new_listing", "claim"],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  urgent: {
    type: Boolean,
    default: false
  },
  read: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
})

// Indexes for better performance
NotificationSchema.index({ userId: 1, read: 1 })
NotificationSchema.index({ createdAt: -1 })

// Add change stream support
NotificationSchema.post('save', function(doc) {
  // This will trigger the change stream in our SSE endpoint
})

export default mongoose.models?.Notification || 
  mongoose.model<INotification>('Notification', NotificationSchema)