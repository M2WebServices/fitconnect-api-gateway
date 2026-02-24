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
  // TODO: Update with actual proto file path once available
  // const grpcClient = createGrpcClient(
  //   'chat.proto',
  //   'chat',
  //   'ChatService',
  //   env.grpc.chatServiceUrl
  // );

  // Mock implementation for development
  console.log('🔗 Chat Service client connecting to:', env.grpc.chatServiceUrl);

  return {
    getGroupMessages: async (request: { groupId: string; limit: number }) => {
      console.log('Chat.getGroupMessages called with:', request);
      return {
        messages: [
          {
            id: 'msg-1',
            content: 'Hello everyone!',
            senderId: 'user-1',
            groupId: request.groupId,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'msg-2',
            content: 'Great to be here!',
            senderId: 'user-2',
            groupId: request.groupId,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    },
    sendMessage: async (request) => {
      console.log('Chat.sendMessage called with:', request);
      return {
        id: 'new-msg-id',
        ...request,
        createdAt: new Date().toISOString(),
      };
    },
    deleteMessage: async (request) => {
      console.log('Chat.deleteMessage called with:', request);
      return { success: true };
    },
    close: () => {
      console.log('Chat client closed');
    },
  };
};
