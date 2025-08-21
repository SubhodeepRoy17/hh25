//lib/models/Receiver.ts
import mongoose, { Document, Schema } from 'mongoose';
import User from './User';

export interface IReceiver extends Document {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  studentId: string;
  isNgo: boolean;
  ngoName?: string;
  foodPreferences: string[];
}

const ReceiverSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  studentId: { type: String, required: true },
  isNgo: { type: Boolean, default: false },
  ngoName: { type: String },
  foodPreferences: { type: [String], default: [] },
}, { timestamps: true });

export default mongoose.models.Receiver || mongoose.model<IReceiver>('Receiver', ReceiverSchema);