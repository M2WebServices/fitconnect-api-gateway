import { createGrpcClient, promisifyGrpcCall } from '../config/grpc';
import env from '../config/env';

export interface PlanningClient {
  getUserPlanning: (request: { userId: string }) => Promise<any>;
  createPlanningEntry: (request: {
    userId: string;
    eventId: string;
    date: string;
  }) => Promise<any>;
  updatePlanningEntry: (request: {
    entryId: string;
    userId: string;
    date: string;
  }) => Promise<any>;
  deletePlanningEntry: (request: { entryId: string; userId: string }) => Promise<any>;
  close: () => void;
}

/**
 * Create Planning Service gRPC client
 * Handles user planning and scheduling operations
 */
export const createPlanningClient = (): PlanningClient => {
  // TODO: Update with actual proto file path once available
  // const grpcClient = createGrpcClient(
  //   'planning.proto',
  //   'planning',
  //   'PlanningService',
  //   env.grpc.planningServiceUrl
  // );

  // Mock implementation for development
  console.log('🔗 Planning Service client connecting to:', env.grpc.planningServiceUrl);

  return {
    getUserPlanning: async (request: { userId: string }) => {
      console.log('Planning.getUserPlanning called with:', request);
      return {
        entries: [
          {
            id: 'entry-1',
            userId: request.userId,
            eventId: 'event-1',
            date: new Date().toISOString(),
          },
        ],
      };
    },
    createPlanningEntry: async (request) => {
      console.log('Planning.createPlanningEntry called with:', request);
      return {
        id: 'new-entry-id',
        ...request,
        createdAt: new Date().toISOString(),
      };
    },
    updatePlanningEntry: async (request) => {
      console.log('Planning.updatePlanningEntry called with:', request);
      return {
        id: request.entryId,
        userId: request.userId,
        date: request.date,
      };
    },
    deletePlanningEntry: async (request) => {
      console.log('Planning.deletePlanningEntry called with:', request);
      return { success: true };
    },
    close: () => {
      console.log('Planning client closed');
    },
  };
};
