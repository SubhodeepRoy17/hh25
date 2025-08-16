// app/api/admin/migrate/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import FoodListing from '@/lib/models/FoodListing';

export async function POST(req: Request) {
  try {
    await connectDB();
    
    // Find listings without geoPoint
    const listingsToUpdate = await FoodListing.find({
      $or: [
        { 'location.geoPoint': { $exists: false } },
        { 'location.geoPoint': null }
      ],
      'location.coordinates': { $exists: true }
    });

    console.log(`Found ${listingsToUpdate.length} listings to update`);

    let updated = 0;
    for (const listing of listingsToUpdate) {
      if (listing.location?.coordinates?.lat && listing.location?.coordinates?.lng) {
        const updateResult = await FoodListing.updateOne(
          { _id: listing._id },
          {
            $set: {
              'location.geoPoint': {
                type: 'Point',
                coordinates: [listing.location.coordinates.lng, listing.location.coordinates.lat]
              }
            }
          }
        );
        if (updateResult.modifiedCount > 0) updated++;
      }
    }

    // Ensure indexes exist
    try {
      await FoodListing.collection.createIndex({ 'location.geoPoint': '2dsphere' });
      console.log('Created 2dsphere index');
    } catch (indexError) {
      console.log('Index might already exist:', indexError);
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} listings with geoPoint data`,
      total: listingsToUpdate.length
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed'
    }, { status: 500 });
  }
}