// lib/auth.ts
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

// Validate JWT_SECRET on startup
export const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET is not defined or too short in environment variables. ' +
      'It should be at least 32 characters long for security.'
    )
  }
  return secret
})()

// Strongly typed token payload
export interface DecodedToken {
  user: any
  userId: string
  role: 'donor' | 'receiver' | 'admin'
  email?: string
  iat?: number
  exp?: number
  ws?: boolean // WebSocket specific flag
}

export const verifyTokenForSSE = (token: string): DecodedToken => {
  if (!token) {
    throw new Error('No token provided')
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256']
    }) as DecodedToken

    if (!decoded.userId || !decoded.role) {
      throw new Error('Invalid token payload')
    }

    return decoded
  } catch (error) {
    console.error('SSE Token verification failed:', error)
    throw error
  }
}

// Extended token generation with WebSocket support
export const generateToken = (
  payload: Omit<DecodedToken, 'iat' | 'exp'>,
  options: {
    expiresIn?: string | number
    forWebSocket?: boolean
  } = {}
): string => {
  try {
    const tokenPayload: DecodedToken = {
      ...payload,
      ...(options.forWebSocket ? { ws: true } : {})
    }

    return jwt.sign(tokenPayload, JWT_SECRET, {
      algorithm: 'HS256'
    })
  } catch (error) {
    console.error('Token generation failed:', error)
    throw new Error('Failed to generate authentication token')
  }
}

// Enhanced token verification with WebSocket support
export const verifyToken = (token: string, isWebSocket = false): DecodedToken => {
  if (!token) {
    throw new Error('No token provided')
  }

  try {
    // Remove 'Bearer ' prefix if present
    const actualToken = token.replace(/^Bearer\s+/i, '')
    
    const decoded = jwt.verify(actualToken, JWT_SECRET, {
      algorithms: ['HS256']
    }) as DecodedToken

    // Additional validation
    if (!decoded.userId || !decoded.role) {
      throw new Error('Invalid token payload')
    }

    // WebSocket specific validation
    if (isWebSocket && !decoded.ws) {
      throw new Error('Token not authorized for WebSocket connection')
    }

    return decoded
  } catch (error) {
    console.error('Token verification failed:', error)
    
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token')
    }
    
    throw new Error('Authentication failed')
  }
}

// Utility function to extract token from headers
export const extractTokenFromHeaders = (headers: Headers | Record<string, string>): string | null => {
  let authHeader: string | null;
  
  if (headers instanceof Headers) {
    authHeader = headers.get('authorization');
  } else if (typeof headers === 'object' && headers !== null) {
    authHeader = headers['authorization'] || headers['Authorization'];
  } else {
    return null;
  }
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

// WebSocket specific authentication
export const authenticateWebSocket = (token: string): DecodedToken => {
  return verifyToken(token, true)
}

function isNextRequest(req: Request | NextRequest): req is NextRequest {
  return 'cookies' in req && 'nextUrl' in req;
}

// Next.js auth helper
export const auth = async (req?: Request | NextRequest): Promise<DecodedToken | null> => {
  try {
    let token: string | null = null;
    
    if (req) {
      if (isNextRequest(req)) {
        // Handle NextRequest
        token = req.cookies.get('token')?.value || extractTokenFromHeaders(req.headers);
      } else {
        // Handle standard Request
        token = extractTokenFromHeaders(req.headers);
      }
    }

    if (!token) {
      return null;
    }

    return verifyToken(token);
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Add to your auth constants
export const NOTIFICATION_CONFIG = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_KEY!,
  privateKey: process.env.PRIVATE_VAPID_KEY!,
  email: process.env.NOTIFICATION_EMAIL!
};