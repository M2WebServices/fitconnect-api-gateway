import { createGrpcClient, promisifyGrpcCall } from '../config/grpc';
import env from '../config/env';

export interface EventClient {
  getEvent: (request: { eventId: string }) => Promise<any>;
  getGroupEvents: (request: { groupId: string }) => Promise<any>;
  getUserEvents: (request: { userId: string }) => Promise<any>;
  createEvent: (request: {
    groupId: string;
    title: string;
    description: string;
    date: string;
    createdBy: string;
  }) => Promise<any>;
  updateEvent: (request: {
    eventId: string;
    title?: string;
    description?: string;
    date?: string;
    userId: string;
  }) => Promise<any>;
  deleteEvent: (request: { eventId: string; userId: string }) => Promise<any>;
  close: () => void;
}

/**
 * Create Event Service gRPC client
 * Handles all event-related operations
 */
export const createEventClient = (): EventClient => {
  // TODO: Update with actual proto file path once available
  // const grpcClient = createGrpcClient(
  //   'event.proto',
  //   'event',
  //   'EventService',
  //   env.grpc.eventServiceUrl
  // );

  // Mock implementation for development
  console.log('🔗 Event Service client connecting to:', env.grpc.eventServiceUrl);

  return {
    getEvent: async (request: { eventId: string }) => {
      console.log('Event.getEvent called with:', request);
      return {
        id: request.eventId,
        title: 'Mock Event',
        description: 'This is a mock event',
        date: new Date().toISOString(),
        groupId: 'group-1',
        createdBy: 'user-1',
      };
    },
    getGroupEvents: async (request: { groupId: string }) => {
      console.log('Event.getGroupEvents called with:', request);
      return {
        events: [
          {
            id: 'event-1',
            title: 'Morning Yoga',
            description: 'Yoga session',
            date: new Date().toISOString(),
            groupId: request.groupId,
            createdBy: 'user-1',
          },
        ],
      };
    },
    getUserEvents: async (request: { userId: string }) => {
      console.log('Event.getUserEvents called with:', request);
      return {
        events: [
          {
            id: 'event-1',
            title: 'My Event',
            description: 'User created event',
            date: new Date().toISOString(),
            groupId: 'group-1',
            createdBy: request.userId,
          },
        ],
      };
    },
    createEvent: async (request) => {
      console.log('Event.createEvent called with:', request);
      return {
        id: 'new-event-id',
        ...request,
        createdAt: new Date().toISOString(),
      };
    },
    updateEvent: async (request) => {
      console.log('Event.updateEvent called with:', request);
      return {
        id: request.eventId,
        title: request.title || 'Updated Event',
        description: request.description || 'Updated description',
        date: request.date || new Date().toISOString(),
        groupId: 'group-1',
        createdBy: request.userId,
      };
    },
    deleteEvent: async (request) => {
      console.log('Event.deleteEvent called with:', request);
      return { success: true };
    },
    close: () => {
      console.log('Event client closed');
    },
  };
};
