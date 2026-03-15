import DataLoader from 'dataloader';
import { AuthClient } from '../../clients/auth.client';

export interface User {
  id: string;
  username: string;
  email: string;
}

/**
 * DataLoader for batching and caching user requests
 * This prevents N+1 query problems
 */
export const createUserLoader = (authClient: AuthClient) => {
  return new DataLoader<string, User | null>(async (userIds: readonly string[]) => {
    console.log('Batch loading users:', userIds);

    const users = await Promise.all(
      userIds.map(async (id) => {
        const user = await authClient.getUser({ userId: id });
        if (!user) {
          return null;
        }

        return {
          id: user.id,
          username: user.pseudo,
          email: user.email,
        };
      })
    );

    return users;
  });
};
