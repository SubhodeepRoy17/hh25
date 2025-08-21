//lib/models/Donor.ts
import mongoose, { Document, Schema } from 'mongoose';
import User from './User';

export interface IDonor extends Document {
  userId: mongoose.Types.ObjectId;
  orgName: string;
  orgType: 'canteen' | 'event';
  phone: string;
  campusEmail: string;
  calendarIntegration?: {
    enabled: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiryDate?: Date;
    lastSynced?: Date;
    webhookId?: string;
    resourceId?: string;
  };
}

const DonorSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  orgName: { type: String, required: true },
  orgType: { type: String, enum: ['canteen', 'event'], required: true },
  phone: { type: String, required: true },
  campusEmail: { type: String, required: true, unique: true },
  calendarIntegration: {
    enabled: { type: Boolean, default: false },
    accessToken: { type: String },
    refreshToken: { type: String },
    expiryDate: { type: Date },
    lastSynced: { type: Date },
    webhookId: { type: String },
    resourceId: { type: String }
  }
}, { timestamps: true });

export default mongoose.models.Donor || mongoose.model<IDonor>('Donor', DonorSchema);