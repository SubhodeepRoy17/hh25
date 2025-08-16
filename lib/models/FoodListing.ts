// lib/models/FoodListing.ts
import mongoose, { Schema, Document } from 'mongoose';

export type FoodType = 'cooked' | 'produce' | 'bakery' | 'packaged' | 'beverages' | 'mixed' | 'vegetarian' | 'vegan';
export type Freshness = 'fresh-hot' | 'fresh-chilled' | 'frozen' | 'room-temp' | 'packaged';
export type QuantityUnit = 'meals' | 'kg' | 'trays' | 'boxes';

interface Location {
  geoPoint: { type: string; coordinates: number[]; };
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
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
  status: 'draft' | 'published' | 'claimed' | 'completed' | 'expired';
  createdBy: Schema.Types.ObjectId;
  interestedUsers?: number;
  createdAt: Date;
  updatedAt: Date;
}

// GeoJSON Point schema for proper geospatial indexing
const GeoJSONPointSchema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true
  }
});

const LocationSchema = new Schema({
  address: { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  // Add GeoJSON point for geospatial queries
  geoPoint: {
    type: GeoJSONPointSchema,
    index: '2dsphere'
  }
});

const FoodListingSchema = new Schema<IFoodListing>(
  {
    title: { type: String, required: true },
    types: { 
      type: [String], 
      required: true, 
      enum: ['cooked', 'produce', 'bakery', 'packaged', 'beverages', 'mixed', 'vegetarian', 'vegan'] 
    },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true, enum: ['meals', 'kg', 'trays', 'boxes'] },
    freshness: { type: String, required: true, enum: ['fresh-hot', 'fresh-chilled', 'frozen', 'room-temp', 'packaged'] },
    availableFrom: { type: Date, required: true },
    availableUntil: { type: Date, required: true },
    location: { 
      type: {
        address: { type: String, required: true },
        coordinates: {
          lat: { type: Number, required: true },
          lng: { type: Number, required: true }
        },
        geoPoint: {
          type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
          },
          coordinates: {
            type: [Number],
            required: true
          }
        }
      },
      required: true 
    },
    instructions: { type: String },
    allowPartial: { type: Boolean, default: true },
    requireInsulated: { type: Boolean, default: false },
    images: { type: [String] },
    status: { 
      type: String, 
      enum: ['draft', 'published', 'claimed', 'completed', 'expired'], 
      default: 'draft' 
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    interestedUsers: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Create indexes
FoodListingSchema.index({ 'location.geoPoint': '2dsphere' });
FoodListingSchema.index({ 'location.coordinates.lat': 1, 'location.coordinates.lng': 1 });
FoodListingSchema.index({ status: 1, availableUntil: 1 });
FoodListingSchema.index({ createdBy: 1, status: 1 });
FoodListingSchema.index({ title: 'text', 'location.address': 'text', instructions: 'text' });

// Pre-save middleware to create GeoJSON point from coordinates
FoodListingSchema.pre('save', function(next) {
  if (this.location?.coordinates) {
    this.location.geoPoint = {
      type: 'Point',
      coordinates: [this.location.coordinates.lng, this.location.coordinates.lat]
    };
  }
  next();
});

// Static method to ensure indexes
FoodListingSchema.statics.ensureIndexes = async function() {
  try {
    await this.syncIndexes();
    console.log('FoodListing indexes verified');
  } catch (err) {
    console.error('Error ensuring indexes:', err);
    throw err;
  }
};

const FoodListing = mongoose.models.FoodListing || mongoose.model<IFoodListing>('FoodListing', FoodListingSchema);

// Ensure indexes on startup
async function ensureIndexes() {
  try {
    await FoodListing.ensureIndexes();
    console.log('FoodListing geospatial indexes created successfully');
  } catch (err) {
    console.error('Error ensuring FoodListing indexes:', err);
  }
}

// Run index creation
ensureIndexes();

export default FoodListing;