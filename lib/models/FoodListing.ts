// lib/models/FoodListing.ts
import mongoose, { Schema, Document } from 'mongoose';

export type FoodType = 'cooked' | 'produce' | 'bakery' | 'packaged' | 'beverages' | 'mixed' | 'vegetarian' | 'vegan';
export type Freshness = 'fresh-hot' | 'fresh-chilled' | 'frozen' | 'room-temp' | 'packaged';
export type QuantityUnit = 'meals' | 'kg' | 'trays' | 'boxes';

interface Location {
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
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema({
  address: { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
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
    location: { type: LocationSchema, required: true },
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
  },
  { timestamps: true }
);

// Create geospatial index for location searches
FoodListingSchema.index({ 'location.coordinates': '2dsphere' });

FoodListingSchema.index({
  title: 'text',
  'location.address': 'text',
  instructions: 'text'
});

export default mongoose.models.FoodListing || mongoose.model<IFoodListing>('FoodListing', FoodListingSchema);