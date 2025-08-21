import { NextRequest, NextResponse } from 'next/server';
import GoogleCalendarService from '@/lib/services/googleCalendar';
import Donor from '@/lib/models/Donor';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/donor/calendar-integration?error=auth_failed`);
    }

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/donor/calendar-integration?error=no_code`);
    }

    // Exchange code for tokens
    const tokens = await GoogleCalendarService.getTokens(code);
    
    // You might want to store the state parameter to identify which user this belongs to
    // For now, we'll need to figure out how to associate this with the user
    
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/donor/calendar-integration?success=connected`);
    
  } catch (error) {
    console.error('Calendar callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/donor/calendar-integration?error=callback_failed`);
  }
}