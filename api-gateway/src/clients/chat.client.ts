import { createGrpcClient, promisifyGrpcCall } from '../config/grpc';
import env from '../config/env';

export interface ChatClient {
  getGroupMessages: (request: { groupId: string; limit: number }) => Promise<any>;
  sendMessage: (request: {
    groupId: string;
    content: string;
    senderId: string;
  }) => Promise<any>;
  deleteMessage: (request: { messageId: string; userId: string }) => Promise<any>;
  close: () => void;
}

/**
 * Create Chat Service gRPC client
 * Handles messaging operations
 */
export const createChatClient = (): ChatClient => {
  console.log('🔗 Chat Service client connecting to:', env.grpc.chatServiceUrl);

  const grpcClient = createGrpcClient(
    'chat.proto',
    'chat',
    'ChatService',
    env.grpc.chatServiceUrl
  );

  const { client } = grpcClient;
  const getGroupMessagesProto = promisifyGrpcCall(client, 'GetGroupMessages');
  const sendMessageProto = promisifyGrpcCall(client, 'SendMessage');
  const deleteMessageProto = promisifyGrpcCall(client, 'DeleteMessage');

  return {
    getGroupMessages: async (request: { groupId: string; limit: number }) => {
      return getGroupMessagesProto({
        groupId: request.groupId,
        limit: request.limit,
      });
    },
    sendMessage: async (request) => {
      return sendMessageProto({
        groupId: request.groupId,
        content: request.content,
        senderId: request.senderId,
      });
    },
    deleteMessage: async (request) => {
      return deleteMessageProto({
        messageId: request.messageId,
        userId: request.userId,
      });
    },
    close: () => {
      grpcClient.close();
    },
  };
};
