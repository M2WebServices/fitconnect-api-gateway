import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { env } from "../config/env";
import { deleteGroupMessage, getGroupMessages, sendGroupMessage } from "../modules/chat-messages";

const PROTO_PATH = path.join(__dirname, "../../proto/chat.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const chatProto = grpc.loadPackageDefinition(packageDefinition) as any;

const getGroupMessagesHandler = async (
  call: grpc.ServerUnaryCall<{ groupId: string; limit?: number }, { messages: unknown[] }>,
  callback: grpc.sendUnaryData<{ messages: unknown[] }>
) => {
  try {
    const messages = await getGroupMessages(call.request.groupId, call.request.limit ?? 50);
    callback(null, { messages });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      details: error instanceof Error ? error.message : "Failed to get group messages",
    });
  }
};

const sendMessageHandler = async (
  call: grpc.ServerUnaryCall<{ groupId: string; content: string; senderId: string }, unknown>,
  callback: grpc.sendUnaryData<unknown>
) => {
  if (!call.request.groupId || !call.request.content || !call.request.senderId) {
    callback({
      code: grpc.status.INVALID_ARGUMENT,
      details: "groupId, content and senderId are required",
      name: "InvalidArgument",
      message: "groupId, content and senderId are required",
    });
    return;
  }

  try {
    const message = await sendGroupMessage(call.request);
    callback(null, message);
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      details: error instanceof Error ? error.message : "Failed to send message",
    });
  }
};

const deleteMessageHandler = async (
  call: grpc.ServerUnaryCall<{ messageId: string; userId: string }, { success: boolean }>,
  callback: grpc.sendUnaryData<{ success: boolean }>
) => {
  if (!call.request.messageId || !call.request.userId) {
    callback({
      code: grpc.status.INVALID_ARGUMENT,
      details: "messageId and userId are required",
      name: "InvalidArgument",
      message: "messageId and userId are required",
    });
    return;
  }

  try {
    const success = await deleteGroupMessage(call.request.messageId, call.request.userId);
    callback(null, { success });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      details: error instanceof Error ? error.message : "Failed to delete message",
    });
  }
};

const chatServiceImpl = {
  GetGroupMessages: getGroupMessagesHandler,
  getGroupMessages: getGroupMessagesHandler,
  SendMessage: sendMessageHandler,
  sendMessage: sendMessageHandler,
  DeleteMessage: deleteMessageHandler,
  deleteMessage: deleteMessageHandler,
};

export const startGrpcServer = (): grpc.Server => {
  const server = new grpc.Server();
  server.addService(chatProto.chat.ChatService.service, chatServiceImpl);

  server.bindAsync(
    `0.0.0.0:${String(env.grpcPort)}`,
    grpc.ServerCredentials.createInsecure(),
    (error) => {
      if (error) {
        console.error("Failed to bind chat-notification gRPC server", error);
        return;
      }
      server.start();
      console.log(`Chat Notification gRPC on port ${env.grpcPort}`);
    }
  );

  return server;
};