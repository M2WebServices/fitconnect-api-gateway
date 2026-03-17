import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import * as authModule from '../modules/auth';

const PROTO_PATH = path.join(__dirname, '../../proto/auth.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const authProto = grpc.loadPackageDefinition(packageDefinition) as any;

interface GetUserRequest {
  user_id: string;
}

interface GetUserResponse {
  id: string;
  email: string;
  pseudo: string;
}

interface ValidateTokenRequest {
  token: string;
}

interface ValidateTokenResponse {
  valid: boolean;
  user_id?: string;
  email?: string;
  pseudo?: string;
}

interface UpdateUserProfileRequest {
  user_id: string;
  email?: string;
  pseudo?: string;
}

interface UpdateUserProfileResponse {
  id: string;
  email: string;
  pseudo: string;
}

const authServiceImpl = {
  async getUser(
    call: grpc.ServerUnaryCall<GetUserRequest, GetUserResponse>,
    callback: grpc.sendUnaryData<GetUserResponse>
  ) {
    try {
      const { user_id } = call.request;
      const user = await authModule.getUserById(user_id);

      if (!user) {
        callback({
          code: grpc.status.NOT_FOUND,
          details: 'User not found',
        });
        return;
      }

      callback(null, {
        id: user.id,
        email: user.email,
        pseudo: user.pseudo,
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        details: 'Internal server error',
      });
    }
  },

  async validateToken(
    call: grpc.ServerUnaryCall<ValidateTokenRequest, ValidateTokenResponse>,
    callback: grpc.sendUnaryData<ValidateTokenResponse>
  ) {
    try {
      const { token } = call.request;
      const payload = await authModule.validateToken(token);

      if (!payload) {
        callback(null, { valid: false });
        return;
      }

      callback(null, {
        valid: true,
        user_id: payload.userId,
        email: payload.email,
        pseudo: payload.pseudo,
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        details: 'Internal server error',
      });
    }
  },

  async updateUserProfile(
    call: grpc.ServerUnaryCall<UpdateUserProfileRequest, UpdateUserProfileResponse>,
    callback: grpc.sendUnaryData<UpdateUserProfileResponse>
  ) {
    try {
      const { user_id, email, pseudo } = call.request;
      const user = await authModule.updateUserProfile({
        userId: user_id,
        email,
        pseudo,
      });

      callback(null, {
        id: user.id,
        email: user.email,
        pseudo: user.pseudo,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      callback({
        code: grpc.status.INTERNAL,
        details: message,
      });
    }
  },
};

export function startGrpcServer() {
  const server = new grpc.Server();

  server.addService(authProto.auth.AuthService.service, authServiceImpl);

  const GRPC_PORT = process.env.GRPC_PORT || '5106';
  server.bindAsync(
    `0.0.0.0:${GRPC_PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err) => {
      if (err) {
        console.error('Failed to bind gRPC server:', err);
        throw err;
      }
      console.log(`✓ gRPC Server running on port ${GRPC_PORT}`);
    }
  );
}
