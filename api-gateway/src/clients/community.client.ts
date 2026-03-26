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
  createUser: (request: { id?: string; username: string; email: string }) => Promise<any>;
  getUser: (request: { id: string }) => Promise<any>;
  addMemberToGroup: (request: { userId: string; groupId: string; role?: string }) => Promise<any>;
  removeMemberFromGroup: (request: { userId: string; groupId: string }) => Promise<any>;
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
  const getGroupProto = promisifyGrpcCall(client, 'GetGroup');
  const getUserGroupsProto = promisifyGrpcCall(client, 'GetUserGroups');
  const searchGroupsProto = promisifyGrpcCall(client, 'SearchGroups');
  const updateGroupProto = promisifyGrpcCall(client, 'UpdateGroup');
  const deleteGroupProto = promisifyGrpcCall(client, 'DeleteGroup');
  const addMemberToGroup = promisifyGrpcCall(client, 'AddMemberToGroup');
  const removeMemberFromGroup = promisifyGrpcCall(client, 'RemoveMemberFromGroup');
  const getGroupMembersProto = promisifyGrpcCall(client, 'GetGroupMembers');
  const isUserInGroup = promisifyGrpcCall(client, 'IsUserInGroup');
  const isAdmin = promisifyGrpcCall(client, 'IsAdmin');

  const mapGroup = (group: any) => ({
    ...group,
    createdAt: group.createdAt || group.created_at,
  });

  return {
    // Direct proto methods
    createUser: async (request) =>
      createUser({
        id: request.id || '',
        username: request.username,
        email: request.email,
      }),
    getUser,
    addMemberToGroup: async (request) =>
      addMemberToGroup({
        user_id: request.userId,
        group_id: request.groupId,
        role: request.role,
      }),
    removeMemberFromGroup: async (request) =>
      removeMemberFromGroup({
        user_id: request.userId,
        group_id: request.groupId,
      }),
    isUserInGroup: async (request) =>
      isUserInGroup({
        user_id: request.userId,
        group_id: request.groupId,
      }),
    isAdmin: async (request) =>
      isAdmin({
        user_id: request.userId,
        group_id: request.groupId,
      }),
    
    // GraphQL adapter methods
    createGroup: async (request) => {
      const response = await createGroupProto({
        name: request.name,
        description: request.description || '',
      });
      return mapGroup(response);
    },

    getGroup: async (request) => {
      const response = await getGroupProto({
        group_id: request.groupId,
      });
      return mapGroup(response);
    },

    getUserGroups: async (request) => {
      const response = await getUserGroupsProto({
        user_id: request.userId,
      });
      return {
        groups: (response.groups || []).map(mapGroup),
      };
    },

    searchGroups: async (request) => {
      const response = await searchGroupsProto({
        query: request.query,
      });
      return {
        groups: (response.groups || []).map(mapGroup),
      };
    },

    updateGroup: async (request) => {
      const response = await updateGroupProto({
        group_id: request.groupId,
        name: request.name,
        description: request.description,
        user_id: request.userId,
      });
      return mapGroup(response);
    },

    deleteGroup: async (request) => {
      return deleteGroupProto({
        group_id: request.groupId,
        user_id: request.userId,
      });
    },

    joinGroup: async (request) => {
      // Utilise AddMemberToGroup
      await addMemberToGroup({
        user_id: request.userId,
        group_id: request.groupId,
        role: 'MEMBER',
      });
      return { success: true };
    },

    leaveGroup: async (request) => {
      return removeMemberFromGroup({
        user_id: request.userId,
        group_id: request.groupId,
      });
    },

    getGroupMembers: async (request) => {
      const response = await getGroupMembersProto({
        group_id: request.groupId,
      });
      const members = (response.members || []).map((member: any) => ({
        ...member,
        userId: member.userId || member.user_id,
        groupId: member.groupId || member.group_id,
        joinedAt: member.joinedAt || member.joined_at,
      }));

      return {
        members,
      };
    },
    
    close: () => grpcClient.close(),
  };
};
