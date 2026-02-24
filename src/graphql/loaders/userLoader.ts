import DataLoader from 'dataloader';

export interface User {
  id: string;
  username: string;
  email: string;
}

/**
 * DataLoader for batching and caching user requests
 * This prevents N+1 query problems
 */
export const createUserLoader = () => {
  return new DataLoader<string, User | null>(async (userIds: readonly string[]) => {
    // TODO: Replace this with actual gRPC call to Auth Service
    // For now, return mock data
    console.log('Batch loading users:', userIds);

    // In a real implementation, you would call:
    // const response = await authClient.getUsers({ userIds: [...userIds] });
    // return response.users;

    // Mock implementation
    return userIds.map(id => ({
      id,
      username: `user-${id}`,
      email: `user-${id}@example.com`,
    }));
  });
};
