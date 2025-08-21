//lib/models/Notification.ts
import mongoose from 'mongoose'

export type NotificationType = "new_listing" | "claim" | "expiring_soon" | "completed" | "event_reminder";

export interface INotification extends mongoose.Document {
  userId: mongoose.Schema.Types.ObjectId
  listingId?: mongoose.Schema.Types.ObjectId
  type: NotificationType
  message: string
  urgent: boolean
  read: boolean
  metadata?: {
    distance?: number
    expiryTime?: Date
    claimerName?: string
  }
  createdAt: Date
}

const NotificationSchema = new mongoose.Schema<INotification>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodListing'
  },
  type: {
    type: String,
    enum: ["new_listing", "claim", "expiring_soon", "completed"],
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
    default: false,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: -1
  }
})

// Optimized indexes
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 })
NotificationSchema.index({ listingId: 1 })
NotificationSchema.index({ createdAt: -1 })

export default mongoose.models?.Notification || 
  mongoose.model<INotification>('Notification', NotificationSchema)