//app/api/auth/verify/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Create a reusable transporter object
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Add these settings for better performance
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
});

// Helper function to send verification email
async function sendVerificationEmail(email: string, token: string, role: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify?token=${token}`;

  const isDonor = role === 'donor';
  const subject = isDonor ? 'Verify Your Donor Account' : 'Verify Your Receiver Account';
  const color = isDonor ? '#2ECC71' : '#3498DB';

  try {
    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"Smart Surplus" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${color};">Welcome, ${isDonor ? 'Food Donor' : 'Food Receiver'}!</h2>
          <p>Thank you for joining Smart Surplus as a ${role}!</p>
          <p>By verifying your account, you'll be able to:</p>
          <ul>
            ${isDonor ? `
              <li>List surplus food items for donation</li>
              <li>Connect with local organizations in need</li>
              <li>Track your donations and impact</li>
            ` : `
              <li>Browse available food donations in your area</li>
              <li>Request food items for your organization</li>
              <li>Coordinate pickups with donors</li>
            `}
          </ul>
          <p>Please click the button below to verify your email address:</p>
          <a href="${verificationUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: ${color}; 
                    color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Verify ${isDonor ? 'Donor' : 'Receiver'} Account
          </a>
          <p style="margin-top: 20px;">Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">
            ${verificationUrl}
          </p>
          <p style="margin-top: 20px;">This link will expire in 24 hours.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
        </div>
      `,
    });

    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Generate and send verification token
export async function POST(request: Request) {
  await dbConnect();

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    // Send verification email immediately
    const emailSent = await sendVerificationEmail(user.email, verificationToken, user.role);

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Error sending verification email:', error);
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  await dbConnect();
  
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Token is required' },
      { status: 400 }
    );
  }

  try {
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return NextResponse.redirect(
      new URL('/auth/verification-success', process.env.NEXT_PUBLIC_BASE_URL)
    );

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.redirect(
      new URL('/auth/verification-failed', process.env.NEXT_PUBLIC_BASE_URL)
    );
  }
}