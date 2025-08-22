import mongoose, { Schema, Document } from 'mongoose';

export type FoodType = 'cooked' | 'produce' | 'bakery' | 'packaged' | 'beverages' | 'mixed' | 'vegetarian' | 'vegan';
export type Freshness = 'fresh-hot' | 'fresh-chilled' | 'frozen' | 'room-temp' | 'packaged';
export type QuantityUnit = 'meals' | 'kg' | 'trays' | 'boxes';
export type ListingStatus = 'draft' | 'published' | 'claimed' | 'completed' | 'expired';

interface LocationCoordinates {
  lat: number;
  lng: number;
}

interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

interface Location {
  address: string;
  coordinates: LocationCoordinates;
  geoPoint: GeoJSONPoint;
}

interface QRCodeData {
  code: string;
  generatedAt: Date;
  expiresAt: Date;
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
}

export interface IFoodListing extends Document {
  title: string;
  types: FoodType[];
  quantity: number;
  unit: QuantityUnit;
  freshness: Freshness;
  availableFrom: Date;
  availableUntil: Date;
  location: Location;
  instructions?: string;
  allowPartial: boolean;
  requireInsulated: boolean;
  images?: string[];
  status: ListingStatus;
  createdBy: mongoose.Types.ObjectId;
  claimedBy?: mongoose.Types.ObjectId;
  interestedUsers?: number;
  responseTime?: number | null;
  claimedAt?: Date | null;
  expiryNotified: boolean;
  qrCodeData?: QRCodeData;
  // Blockchain fields
  blockchainId?: number;
  txHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GeoJSONPointSchema = new Schema<GeoJSONPoint>({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point',
    required: true
  },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator: (coords: number[]) => coords.length === 2,
      message: 'Coordinates must be an array of [longitude, latitude]'
    }
  }
});

const LocationSchema = new Schema<Location>({
  address: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 200
  },
  coordinates: {
    lat: { 
      type: Number, 
      required: true,
      min: -90,
      max: 90
    },
    lng: { 
      type: Number, 
      required: true,
      min: -180,
      max: 180
    }
  },
  geoPoint: {
    type: GeoJSONPointSchema,
    index: '2dsphere',
    required: true
  }
});

const QRCodeDataSchema = new Schema<QRCodeData>({
  code: {
    type: String,
    required: true,
    index: true
  },
  generatedAt: {
    type: Date,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

const FoodListingSchema = new Schema<IFoodListing>(
  {
    title: { 
      type: String, 
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100
    },
    types: { 
      type: [String], 
      required: true, 
      enum: ['cooked', 'produce', 'bakery', 'packaged', 'beverages', 'mixed', 'vegetarian', 'vegan'],
      validate: {
        validator: (types: FoodType[]) => types.length > 0,
        message: 'At least one food type must be specified'
      }
    },
    quantity: { 
      type: Number, 
      required: true,
      min: 1,
      max: 1000
    },
    unit: { 
      type: String, 
      required: true, 
      enum: ['meals', 'kg', 'trays', 'boxes'] 
    },
    freshness: { 
      type: String, 
      required: true, 
      enum: ['fresh-hot', 'fresh-chilled', 'frozen', 'room-temp', 'packaged'] 
    },
    availableFrom: { 
      type: Date, 
      required: true,
      validate: {
        validator: function(this: IFoodListing, value: Date) {
          return this.availableUntil ? value < this.availableUntil : true;
        },
        message: 'Available from must be before available until'
      }
    },
    availableUntil: { 
      type: Date, 
      required: true,
      validate: {
        validator: function(this: IFoodListing, value: Date) {
          return this.availableFrom ? value > this.availableFrom : true;
        },
        message: 'Available until must be after available from'
      }
    },
    location: { 
      type: LocationSchema,
      required: true 
    },
    instructions: { 
      type: String,
      trim: true,
      maxlength: 500
    },
    allowPartial: { 
      type: Boolean, 
      default: true 
    },
    requireInsulated: { 
      type: Boolean, 
      default: false 
    },
    images: { 
      type: [String],
      validate: {
        validator: (images: string[]) => images.length <= 5,
        message: 'Cannot have more than 5 images'
      }
    },
    status: { 
      type: String, 
      enum: ['draft', 'published', 'claimed', 'completed', 'expired'], 
      default: 'draft',
      index: true
    },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true
    },
    claimedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      index: true
    },
    interestedUsers: { 
      type: Number, 
      default: 0,
      min: 0
    },
    responseTime: { 
      type: Number, 
      default: null,
      min: 0
    },
    claimedAt: { 
      type: Date, 
      default: null
    },
    expiryNotified: {
      type: Boolean,
      default: false
    },
    qrCodeData: {
      type: QRCodeDataSchema
    },
    // Blockchain fields
    blockchainId: {
      type: Number,
      unique: true,
      sparse: true,
    },
    txHash: {
      type: String,
    }
  },
  { 
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      }
    },
    toObject: {
      virtuals: true
    }
  }
);

// Pre-save middleware
FoodListingSchema.pre<IFoodListing>('save', function(next) {
  // Ensure geoPoint is synced with coordinates
  if (this.location?.coordinates && !this.location.geoPoint) {
    this.location.geoPoint = {
      type: 'Point',
      coordinates: [this.location.coordinates.lng, this.location.coordinates.lat]
    };
  }

  // Calculate response time when claimed
  if (this.isModified('status') && this.status === 'claimed') {
    this.claimedAt = new Date();
    if (this.createdAt) {
      this.responseTime = Math.floor(
        (this.claimedAt.getTime() - this.createdAt.getTime()) / (1000 * 60)
      );
    }
  }

  // Auto-expire if past availableUntil
  if (this.availableUntil && new Date() > this.availableUntil && this.status !== 'completed') {
    this.status = 'expired';
  }

  next();
});

// Indexes
FoodListingSchema.index({ 'location.geoPoint': '2dsphere' });
FoodListingSchema.index({ status: 1, availableUntil: 1 });
FoodListingSchema.index({ createdBy: 1, status: 1 });
FoodListingSchema.index({ claimedBy: 1, status: 1 });
FoodListingSchema.index({ 'qrCodeData.code': 1 }); // Index for QR code lookup
FoodListingSchema.index({ title: 'text', 'location.address': 'text', instructions: 'text' });

// Virtuals
FoodListingSchema.virtual('donor', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true
});

FoodListingSchema.virtual('claimer', {
  ref: 'User',
  localField: 'claimedBy',
  foreignField: '_id',
  justOne: true
});

// Static methods
FoodListingSchema.statics.ensureIndexes = async function() {
  try {
    await this.syncIndexes();
    console.log('FoodListing indexes verified');
  } catch (err) {
    console.error('Error ensuring indexes:', err);
    throw err;
  }
};

// Check for expiring listings
FoodListingSchema.statics.checkExpiringListings = async function() {
  const now = new Date();
  const warningThreshold = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // 2 hours from now
  
  try {
    const expiringListings = await this.find({
      status: 'claimed',
      availableUntil: {
        $lte: warningThreshold,
        $gt: now
      },
      expiryNotified: { $ne: true } // Only notify once
    }).populate('claimedBy createdBy');
    
    console.log(`Found ${expiringListings.length} listings expiring soon`);
    
    for (const listing of expiringListings) {
      // Import here to avoid circular dependency
      const { notifyExpiringSoon } = await import('@/lib/services/notifications');
      await notifyExpiringSoon(listing._id.toString());
      
      // Mark as notified to prevent duplicate notifications
      listing.expiryNotified = true;
      await listing.save();
    }
    
    return expiringListings.length;
  } catch (error) {
    console.error('Error checking expiring listings:', error);
    return 0;
  }
};

// Expire old listings
FoodListingSchema.statics.expireOldListings = async function() {
  const now = new Date();
  
  try {
    const expired = await this.updateMany(
      { 
        availableUntil: { $lt: now },
        status: { $in: ['published', 'claimed'] } // Don't update completed listings
      },
      { $set: { status: 'expired' } }
    );
    
    console.log(`Expired ${expired.modifiedCount} listings`);
    return expired.modifiedCount;
  } catch (error) {
    console.error('Error expiring old listings:', error);
    return 0;
  }
};

const FoodListing = mongoose.models.FoodListing || 
  mongoose.model<IFoodListing>('FoodListing', FoodListingSchema);

// Initialize indexes on startup
async function initialize() {
  try {
    await FoodListing.ensureIndexes();
    console.log('FoodListing model initialized');
  } catch (err) {
    console.error('Failed to initialize FoodListing model:', err);
  }
}

initialize().catch(console.error);

export default FoodListing;