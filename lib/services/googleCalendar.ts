import { OAuth2Client } from 'google-auth-library';
import { calendar_v3, google } from 'googleapis';

class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private calendar: calendar_v3.Calendar;

  constructor() {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  setCredentials(tokens: any) {
    this.oauth2Client.setCredentials(tokens);
  }

  async getAuthUrl(userId: string): Promise<string> {
    return this.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events.readonly'
        ],
        prompt: 'consent',
        state: userId, // Include user ID in state parameter
        include_granted_scopes: true
    });
    }

  async getTokens(code: string): Promise<any> {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  async refreshAccessToken(refreshToken: string): Promise<any> {
    try {
        this.oauth2Client.setCredentials({
        refresh_token: refreshToken
        });
        
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        return credentials;
    } catch (error) {
        console.error('Failed to refresh access token:', error);
        throw new Error('Token refresh failed');
    }
    }

  async listEvents(timeMin: string, timeMax: string): Promise<calendar_v3.Schema$Event[]> {
    try {
        const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        });

        return response.data.items || [];
    } catch (error) {
    console.error('Google Calendar API listEvents error:', error);
    
    throw error;
  }
  }

  async watchEvents(channel: any): Promise<any> {
    const response = await this.calendar.events.watch({
      calendarId: 'primary',
      requestBody: channel
    });
    
    return response.data;
  }

  async stopChannel(resourceId: string): Promise<void> {
    await this.calendar.channels.stop({
      requestBody: {
        id: resourceId,
        resourceId
      }
    });
  }

  async getEvent(eventId: string): Promise<calendar_v3.Schema$Event> {
    const response = await this.calendar.events.get({
      calendarId: 'primary',
      eventId
    });
    
    return response.data;
  }
}

export default new GoogleCalendarService();