import { createGrpcClient, promisifyGrpcCall } from '../config/grpc';
import env from '../config/env';

export type AuthUser = {
  id: string;
  email: string;
  pseudo: string;
};

export type AuthValidation = {
  valid: boolean;
  user_id?: string;
  email?: string;
  pseudo?: string;
};

export interface AuthClient {
  getUser: (request: { userId: string }) => Promise<AuthUser | null>;
  validateToken: (request: { token: string }) => Promise<AuthValidation>;
  updateUserProfile: (request: { userId: string; email?: string; pseudo?: string }) => Promise<AuthUser>;
  close: () => void;
}

export const createAuthClient = (): AuthClient => {
  console.log('🔗 Auth Service client connecting to:', env.grpc.authServiceUrl);

  const grpcClient = createGrpcClient('auth.proto', 'auth', 'AuthService', env.grpc.authServiceUrl);
  const { client } = grpcClient;

  const getUserProto = promisifyGrpcCall(client, 'GetUser');
  const validateTokenProto = promisifyGrpcCall(client, 'ValidateToken');
  const updateUserProfileProto = promisifyGrpcCall(client, 'UpdateUserProfile');

  return {
    getUser: async ({ userId }) => {
      try {
        const response = await getUserProto({ user_id: userId });
        return {
          id: response.id,
          email: response.email,
          pseudo: response.pseudo,
        };
      } catch {
        return null;
      }
    },
    validateToken: async ({ token }) => {
      return validateTokenProto({ token });
    },
    updateUserProfile: async ({ userId, email, pseudo }) => {
      const response = await updateUserProfileProto({
        user_id: userId,
        email,
        pseudo,
      });
      return {
        id: response.id,
        email: response.email,
        pseudo: response.pseudo,
      };
    },
    close: () => {
      grpcClient.close();
    },
  };
};