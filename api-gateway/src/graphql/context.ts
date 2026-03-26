import { AuthClient } from '../clients/auth.client';
import { createUserLoader } from './loaders/userLoader';

// In-process cache: avoid re-provisioning the same user on every request.
const syncedUserIds = new Set<string>();

export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
}

export interface GraphQLContext {
  user: JwtPayload | null;
  clients: {
    community: any;
    event: any;
    chat: any;
    ranking: any;
    auth: AuthClient;
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
      const validation = await clients.auth.validateToken({ token });

      if (validation.valid && validation.user_id) {
        user = {
          userId: validation.user_id,
          email: validation.email || '',
          username: validation.pseudo || '',
        };

        // Ensure corresponding user record exists in community service (same UUID as auth).
        if (!syncedUserIds.has(user.userId)) {
          let syncSucceeded = false;
          try {
            await clients.community.createUser({
              id: user.userId,
              username: user.username,
              email: user.email,
            });
            syncSucceeded = true;
          } catch {
            // ConflictException means user already exists.
            try {
              await clients.community.getUser({ id: user.userId });
              syncSucceeded = true;
            } catch {
              syncSucceeded = false;
            }
          }

          if (syncSucceeded) {
            syncedUserIds.add(user.userId);
          }
        }
      }
    }
  } catch (error) {
    // If token verification fails, user remains null
    console.error('Token verification failed:', error);
  }

  return {
    user,
    clients,
    loaders: {
      userLoader: createUserLoader(clients.auth),
    },
  };
};
