import { NextRequest, NextResponse } from 'next/server';
import GoogleCalendarService from '@/lib/services/googleCalendar';
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

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'url') {
      const authUrl = await GoogleCalendarService.getAuthUrl();
      return NextResponse.json({ authUrl });
    }
    
    if (action === 'status') {
      const donor = await Donor.findOne({ userId: decoded.userId });
      const connected = !!donor?.calendarIntegration?.accessToken;
      return NextResponse.json({ connected });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Calendar auth error:', error);
    return NextResponse.json(
      { error: 'Failed to process calendar authentication' },
      { status: 500 }
    );
  }
}

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

    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json({ error: 'Authorization code required' }, { status: 400 });
    }

    const tokens = await GoogleCalendarService.getTokens(code);
    
    // Save tokens to donor profile
    const donor = await Donor.findOneAndUpdate(
      { userId: decoded.userId },
      {
        calendarIntegration: {
          enabled: true,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: new Date(tokens.expiry_date),
          lastSynced: new Date()
        }
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, donor: donor._id });
  } catch (error) {
    console.error('Calendar token exchange error:', error);
    return NextResponse.json(
      { error: 'Failed to exchange authorization code' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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