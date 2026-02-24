import { createGrpcClient, promisifyGrpcCall } from '../config/grpc';
import env from '../config/env';

export interface CommunityClient {
  // GraphQL-compatible methods (adapters)
  getGroup: (request: { groupId: string }) => Promise<any>;
  getUserGroups: (request: { userId: string }) => Promise<any>;
  searchGroups: (request: { query: string }) => Promise<any>;
  createGroup: (request: { name: string; description: string; ownerId?: string }) => Promise<any>;
  updateGroup: (request: { groupId: string; name?: string; description?: string; userId: string }) => Promise<any>;
  deleteGroup: (request: { groupId: string; userId: string }) => Promise<any>;
  joinGroup: (request: { groupId: string; userId: string }) => Promise<any>;
  leaveGroup: (request: { groupId: string; userId: string }) => Promise<any>;
  getGroupMembers: (request: { groupId: string }) => Promise<any>;
  
  // Direct proto methods
  createUser: (request: { username: string; email: string }) => Promise<any>;
  getUser: (request: { id: string }) => Promise<any>;
  addMemberToGroup: (request: { userId: string; groupId: string; role?: string }) => Promise<any>;
  isUserInGroup: (request: { userId: string; groupId: string }) => Promise<any>;
  isAdmin: (request: { userId: string; groupId: string }) => Promise<any>;
  
  close: () => void;
}

/**
 * Create Community Service gRPC client
 * Handles all group/community related operations
 */
export const createCommunityClient = (): CommunityClient => {
  console.log('🔗 Community Service client connecting to:', env.grpc.communityServiceUrl);

  const grpcClient = createGrpcClient(
    'community.proto',
    'community',
    'CommunityService',
    env.grpc.communityServiceUrl
  );

  const { client } = grpcClient;

  // Direct proto methods
  const createUser = promisifyGrpcCall(client, 'CreateUser');
  const getUser = promisifyGrpcCall(client, 'GetUser');
  const createGroupProto = promisifyGrpcCall(client, 'CreateGroup');
  const addMemberToGroup = promisifyGrpcCall(client, 'AddMemberToGroup');
  const getGroupMembersProto = promisifyGrpcCall(client, 'GetGroupMembers');
  const isUserInGroup = promisifyGrpcCall(client, 'IsUserInGroup');
  const isAdmin = promisifyGrpcCall(client, 'IsAdmin');

  return {
    // Direct proto methods
    createUser,
    getUser,
    addMemberToGroup,
    isUserInGroup,
    isAdmin,
    
    // GraphQL adapter methods
    createGroup: async (request) => {
      const response = await createGroupProto({
        name: request.name,
        description: request.description || '',
      });
      return response;
    },

    getGroup: async (request) => {
      // Note: Le proto n'a pas de GetGroup, retourne mock pour l'instant
      console.warn('⚠️  GetGroup not implemented in proto, returning mock');
      return {
        id: request.groupId,
        name: 'Mock Group',
        description: 'GetGroup RPC not in proto',
        created_at: new Date().toISOString(),
      };
    },

    getUserGroups: async (_request) => {
      // Note: Le proto n'a pas de GetUserGroups, retourne mock pour l'instant
      console.warn('⚠️  GetUserGroups not implemented in proto, returning mock');
      return {
        groups: [],
      };
    },

    searchGroups: async (_request) => {
      // Note: Le proto n'a pas de SearchGroups, retourne mock pour l'instant
      console.warn('⚠️  SearchGroups not implemented in proto, returning mock');
      return {
        groups: [],
      };
    },

    updateGroup: async (_request) => {
      // Note: Le proto n'a pas de UpdateGroup
      console.warn('⚠️  UpdateGroup not implemented in proto');
      throw new Error('UpdateGroup not implemented in Community Service');
    },

    deleteGroup: async (_request) => {
      // Note: Le proto n'a pas de DeleteGroup
      console.warn('⚠️  DeleteGroup not implemented in proto');
      throw new Error('DeleteGroup not implemented in Community Service');
    },

    joinGroup: async (request) => {
      // Utilise AddMemberToGroup
      await addMemberToGroup({
        userId: request.userId,
        groupId: request.groupId,
        role: 'MEMBER',
      });
      return { success: true };
    },

    leaveGroup: async (_request) => {
      // Note: Le proto n'a pas de LeaveGroup/RemoveMember
      console.warn('⚠️  LeaveGroup not implemented in proto');
      throw new Error('LeaveGroup not implemented in Community Service');
    },

    getGroupMembers: async (request) => {
      const response = await getGroupMembersProto({
        groupId: request.groupId,
      });
      // Adapter le format de réponse
      return {
        members: response.members || [],
      };
    },
    
    close: () => grpcClient.close(),
  };
};
