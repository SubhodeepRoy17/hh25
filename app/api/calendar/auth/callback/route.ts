import { NextRequest, NextResponse } from 'next/server';
import GoogleCalendarService from '@/lib/services/googleCalendar';
import Donor from '@/lib/models/Donor';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const scope = searchParams.get('scope');

    console.log('Calendar callback received:', { code: !!code, state, error, scope });

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/donor/calendar-integration?error=auth_failed&message=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/donor/calendar-integration?error=no_code`
      );
    }

    // Get the user ID from state parameter or session
    let userId: string | null = null;
    
    if (state) {
      // State should contain the user ID (you need to set this when generating the auth URL)
      userId = state;
    } else {
      // Fallback: try to get user from session/token
      try {
        const token = cookies().get('token')?.value;
        if (token) {
          const decoded = verifyToken(token);
          userId = decoded.userId;
        }
      } catch (sessionError) {
        console.error('Failed to get user from session:', sessionError);
      }
    }

    if (!userId) {
      console.error('Cannot identify user for calendar integration');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/donor/calendar-integration?error=user_not_found`
      );
    }

    // Exchange code for tokens
    console.log('Exchanging code for tokens...');
    const tokens = await GoogleCalendarService.getTokens(code);
    console.log('Tokens received successfully');

    // Save tokens to donor profile
    console.log('Saving tokens to donor profile for user:', userId);
    const donor = await Donor.findOneAndUpdate(
      { userId },
      {
        $set: {
          'calendarIntegration.enabled': true,
          'calendarIntegration.accessToken': tokens.access_token,
          'calendarIntegration.refreshToken': tokens.refresh_token,
          'calendarIntegration.expiryDate': new Date(tokens.expiry_date),
          'calendarIntegration.lastSynced': new Date(),
          'calendarIntegration.scopes': scope?.split(' ') || []
        }
      },
      { new: true, upsert: false }
    );

    if (!donor) {
      console.error('Donor not found for user:', userId);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/donor/calendar-integration?error=donor_not_found`
      );
    }

    console.log('Calendar integration completed successfully for donor:', donor._id);

    // Set up webhook for calendar changes (optional but recommended)
    try {
      GoogleCalendarService.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date
      });

      // Create watch channel for calendar events
      const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/calendar/webhook`;
      const channel = await GoogleCalendarService.watchEvents({
        id: `channel_${donor._id}_${Date.now()}`,
        type: 'web_hook',
        address: webhookUrl,
        token: donor._id.toString()
      });

      // Save webhook details
      await Donor.findOneAndUpdate(
        { userId },
        {
          $set: {
            'calendarIntegration.webhookId': channel.id,
            'calendarIntegration.resourceId': channel.resourceId
          }
        }
      );

      console.log('Webhook setup completed');
    } catch (webhookError) {
      console.error('Webhook setup failed (this is optional):', webhookError);
      // Continue anyway - webhook is optional
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/donor/calendar-integration?success=connected`
    );
    
  } catch (error) {
    console.error('Calendar callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/donor/calendar-integration?error=callback_failed&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
    );
  }
}