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
    required: true,
    index: true
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
    default: false,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: -1 // Descending index
  }
})

// Add change stream support
NotificationSchema.post('save', function(doc) {
  console.log('Notification saved:', doc._id)
})

// Optimize for common queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 })

export default mongoose.models?.Notification || 
  mongoose.model<INotification>('Notification', NotificationSchema)