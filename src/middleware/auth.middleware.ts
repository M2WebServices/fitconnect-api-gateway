import { Request, Response, NextFunction } from 'express';
import authConfig from '../config/auth';

/**
 * Express middleware for JWT authentication
 * Verifies the token and attaches user to request object
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const user = await authConfig.verifyToken(token);

    // Attach user to request object for downstream use
    (req as any).user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: error instanceof Error ? error.message : 'Invalid token',
    });
  }
};

/**
 * Optional auth middleware - doesn't fail if no token is provided
 * Used for endpoints that work with or without authentication
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await authConfig.verifyToken(token);
      (req as any).user = user;
    }

    next();
  } catch (error) {
    // Continue without user if token is invalid
    console.warn('Optional auth failed:', error);
    next();
  }
};
