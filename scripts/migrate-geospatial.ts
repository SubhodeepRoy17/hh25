// scripts/migrate-geospatial.ts
// Run this script once to add geoPoint to existing listings

import connectDB from '@/lib/db';
import FoodListing from '@/lib/models/FoodListing';

async function migrateGeoPoints() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find all listings without geoPoint
    const listingsToUpdate = await FoodListing.find({
      'location.geoPoint': { $exists: false },
      'location.coordinates': { $exists: true }
    });

    console.log(`Found ${listingsToUpdate.length} listings to update`);

    for (const listing of listingsToUpdate) {
      if (listing.location?.coordinates?.lat && listing.location?.coordinates?.lng) {
        listing.location.geoPoint = {
          type: 'Point',
          coordinates: [listing.location.coordinates.lng, listing.location.coordinates.lat]
        };
        await listing.save();
        console.log(`Updated listing: ${listing.title}`);
      }
    }

    // Create indexes
    await FoodListing.collection.createIndex({ 'location.geoPoint': '2dsphere' });
    console.log('Created 2dsphere index on location.geoPoint');

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}