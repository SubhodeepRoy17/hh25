import { NextRequest, NextResponse } from 'next/server';
import Donor from '@/lib/models/Donor';
import { verifyToken, extractTokenFromHeaders } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Extract and verify token from headers
    const token = extractTokenFromHeaders(request.headers);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const donor = await Donor.findOne({ userId: decoded.userId });
    const connected = !!donor?.calendarIntegration?.accessToken;
    return NextResponse.json({ connected });
    
  } catch (error) {
    console.error('Calendar status error:', error);
    return NextResponse.json(
      { error: 'Failed to get calendar status' },
      { status: 500 }
    );
  }
}