import mongoose from 'mongoose'

export type NotificationType = "pickup" | "expiring" | "completed"

export interface INotification extends mongoose.Document {
  userId: mongoose.Schema.Types.ObjectId
  listingId?: mongoose.Schema.Types.ObjectId
  type: NotificationType
  message: string
  urgent: boolean
  read: boolean
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
    enum: ["pickup", "expiring", "completed"],
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
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Add change stream support
NotificationSchema.post('save', function(doc) {
  // This will trigger the change stream in our SSE endpoint
})

export default mongoose.models.Notification || 
  mongoose.model<INotification>('Notification', NotificationSchema)