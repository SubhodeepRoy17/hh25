// app/api/nominatim/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const limit = searchParams.get('limit') || '5';

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=${limit}`,
      {
        headers: {
          'User-Agent': 'YourAppName (your@email.com)' // Required by Nominatim
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch locations');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Nominatim API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location suggestions' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Origin', 'https://hh25-olive.vercel.app');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return new NextResponse(null, { headers });
}