//lib\models\User.ts
import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  role: 'donor' | 'receiver';
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  location?: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    geoPoint: {
      type: 'Point';
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['donor', 'receiver'], required: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpires: { type: Date },
  location: {
    address: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    },
    geoPoint: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  }
}, { timestamps: true });

// Create geospatial index for location queries
UserSchema.index({ 'location.geoPoint': '2dsphere' });

UserSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Ensure geoPoint is synced with coordinates when location is modified
UserSchema.pre<IUser>('save', function(next) {
  if (this.isModified('location') && this.location?.coordinates) {
    if (!this.location.geoPoint) {
      this.location.geoPoint = {
        type: 'Point',
        coordinates: [this.location.coordinates.lng, this.location.coordinates.lat]
      };
    } else {
      // Update geoPoint coordinates if they don't match
      this.location.geoPoint.coordinates = [
        this.location.coordinates.lng, 
        this.location.coordinates.lat
      ];
    }
  }
  next();
});

UserSchema.methods.comparePassword = async function(
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);