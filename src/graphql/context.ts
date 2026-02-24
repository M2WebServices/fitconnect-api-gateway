import authConfig, { JwtPayload } from '../config/auth';
import { createUserLoader } from './loaders/userLoader';

export interface GraphQLContext {
  user: JwtPayload | null;
  clients: {
    community: any;
    event: any;
    planning: any;
    chat: any;
    ranking: any;
  };
  loaders: {
    userLoader: ReturnType<typeof createUserLoader>;
  };
}

export interface ContextParams {
  req: any; // Apollo Server standalone provides a different req object
  clients: GraphQLContext['clients'];
}

/**
 * Create GraphQL context for each request
 * Extracts JWT from Authorization header and verifies it
 */
export const createContext = async ({ req, clients }: ContextParams): Promise<GraphQLContext> => {
  let user: JwtPayload | null = null;

  try {
    // Extract token from Authorization header
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      user = await authConfig.verifyToken(token);
    }
  } catch (error) {
    // If token verification fails, user remains null
    console.error('Token verification failed:', error);
  }

  return {
    user,
    clients,
    loaders: {
      userLoader: createUserLoader(),
    },
  };
};
