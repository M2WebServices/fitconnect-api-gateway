import env from './env';
import { jwt } from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface AuthConfig {
  verifyToken: (token: string) => Promise<JwtPayload>;
  decodeToken: (token: string) => JwtPayload | null;
}

/**
 * Verify and decode JWT token
 * @param token - JWT token string
 * @returns Decoded payload
 * @throws Error if token is invalid or expired
 */
const verifyToken = async (token: string): Promise<JwtPayload> => {
  try {
    const decoded = jwt.verify(token, env.jwt.secret) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
};

/**
 * Decode JWT token without verification (for debugging)
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
};

const authConfig: AuthConfig = {
  verifyToken,
  decodeToken,
};

export default authConfig;
