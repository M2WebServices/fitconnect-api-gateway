import { Request, Response, NextFunction } from 'express';
import { GraphQLError } from 'graphql';

/**
 * Global error handler middleware for Express
 */
export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Handle different error types
  if (error instanceof GraphQLError) {
    return res.status(400).json({
      error: 'GraphQL Error',
      message: error.message,
      extensions: error.extensions,
    });
  }

  // Handle gRPC errors
  if ((error as any).code) {
    return res.status(500).json({
      error: 'Service Error',
      message: error.message,
      code: (error as any).code,
    });
  }

  // Default error response
  return res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message,
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundMiddleware = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
};

/**
 * Request logger middleware
 */
export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};
