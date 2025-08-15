// ./lib/types/notification.d.ts
export type NotificationType = "pickup" | "expiring" | "completed";


export interface Notification {
  _id: string;
  type: NotificationType;
  message: string;
  urgent: boolean;
  read: boolean;
  createdAt: Date;
  userId: string;
  listingId?: string;
}