import { NextRequest, NextResponse } from 'next/server';
import Donor from '@/lib/models/Donor';
import { verifyToken, extractTokenFromHeaders } from '@/lib/auth';

export async function POST(request: NextRequest) {
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

    // Remove calendar integration from donor profile
    await Donor.findOneAndUpdate(
      { userId: decoded.userId },
      {
        $unset: { calendarIntegration: 1 }
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Calendar disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect calendar' },
      { status: 500 }
    );
  }
}