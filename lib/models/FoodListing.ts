//lib\models\FoodListing.ts
import mongoose, { Schema, Document } from 'mongoose';

export type FoodType = 'cooked' | 'produce' | 'bakery' | 'packaged' | 'beverages' | 'mixed';
export type Freshness = 'fresh-hot' | 'fresh-chilled' | 'frozen' | 'room-temp' | 'packaged';
export type QuantityUnit = 'meals' | 'kg' | 'trays' | 'boxes';

export interface IFoodListing extends Document {
  title: string;
  types: FoodType[];
  quantity: number;
  unit: QuantityUnit;
  freshness: Freshness;
  availableFrom: Date;
  availableUntil: Date;
  location: { 
    type: String,
    required: true 
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  }
  instructions?: string;
  allowPartial: boolean;
  requireInsulated: boolean;
  images?: string[]; // Will store URLs after upload
  status: 'draft' | 'published' | 'claimed' | 'completed' | 'expired';
  createdBy: Schema.Types.ObjectId; // Reference to user
  createdAt: Date;
  updatedAt: Date;
}

const FoodListingSchema = new Schema<IFoodListing>(
  {
    title: { type: String, required: true },
    types: { type: [String], required: true, enum: ['cooked', 'produce', 'bakery', 'packaged', 'beverages', 'mixed'] },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true, enum: ['meals', 'kg', 'trays', 'boxes'] },
    freshness: { type: String, required: true, enum: ['fresh-hot', 'fresh-chilled', 'frozen', 'room-temp', 'packaged'] },
    availableFrom: { type: Date, required: true },
    availableUntil: { type: Date, required: true },
    location: { type: String, required: true },
    instructions: { type: String },
    allowPartial: { type: Boolean, default: true },
    requireInsulated: { type: Boolean, default: false },
    images: { type: [String] },
    status: { type: String, enum: ['draft', 'published', 'claimed', 'completed', 'expired'], default: 'draft' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

FoodListingSchema.index({
  title: 'text',
  location: 'text',
  instructions: 'text'
})

export default mongoose.models.FoodListing || mongoose.model<IFoodListing>('FoodListing', FoodListingSchema);
