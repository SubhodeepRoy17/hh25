import mongoose from 'mongoose'

export interface ISubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  // You can add other fields like expirationTime if needed
}

export interface INotificationSubscription extends mongoose.Document {
  userId: mongoose.Schema.Types.ObjectId
  subscription: ISubscription
  createdAt: Date
  updatedAt: Date
}

const NotificationSubscriptionSchema = new mongoose.Schema<INotificationSubscription>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Each user should have only one subscription
  },
  subscription: {
    type: {
      endpoint: { type: String, required: true },
      keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true }
      }
    },
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Update the updatedAt field before saving
NotificationSubscriptionSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Add change stream support if needed (similar to NotificationModel)
NotificationSubscriptionSchema.post('save', function(doc) {
  // This will trigger the change stream in our SSE endpoint if needed
})

export default mongoose.models.NotificationSubscription || 
  mongoose.model<INotificationSubscription>('NotificationSubscription', NotificationSubscriptionSchema)