import { createGrpcClient, promisifyGrpcCall } from '../config/grpc';
import env from '../config/env';

type Timestamp = {
  seconds?: number | string;
  nanos?: number;
};

export interface EventClient {
  getEvent: (request: { eventId: string }) => Promise<any>;
  getGroupEvents: (request: { groupId: string }) => Promise<any>;
  getUserEvents: (request: { userId: string }) => Promise<any>;
  createEvent: (request: {
    groupId: string;
    title: string;
    description: string;
    date: string;
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

const toTimestamp = (date: string): Timestamp => {
  const parsed = new Date(date);
  const ms = parsed.getTime();
  const seconds = Math.floor(ms / 1000);
  const nanos = (ms % 1000) * 1_000_000;
  return { seconds, nanos };
};

const fromTimestamp = (timestamp?: Timestamp): string | null => {
  if (!timestamp || timestamp.seconds === undefined || timestamp.seconds === null) {
    return null;
  }

  const seconds = typeof timestamp.seconds === 'string'
    ? parseInt(timestamp.seconds, 10)
    : timestamp.seconds;
  const nanos = timestamp.nanos || 0;
  const ms = seconds * 1000 + Math.floor(nanos / 1_000_000);
  return new Date(ms).toISOString();
};

const mapEventResponse = (event: any) => {
  if (!event) return event;

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    groupId: event.groupId,
    date: fromTimestamp(event.date) || new Date().toISOString(),
    createdAt: fromTimestamp(event.createdAt),
  };
};

/**
 * Create Event Service gRPC client
 * Handles all event-related operations
 */
export const createEventClient = (): EventClient => {
  console.log('Event Service client connecting to:', env.grpc.eventServiceUrl);

  const grpcClient = createGrpcClient(
    'event.proto',
    'event',
    'EventService',
    env.grpc.eventServiceUrl
  );

  const { client } = grpcClient;

  const createEventProto = promisifyGrpcCall(client, 'CreateEvent');
  const getEventProto = promisifyGrpcCall(client, 'GetEvent');
  const listEventsByGroupProto = promisifyGrpcCall(client, 'ListEventsByGroup');

  return {
    getEvent: async (request: { eventId: string }) => {
      const response = await getEventProto({ id: request.eventId });
      return mapEventResponse(response);
    },
    getGroupEvents: async (request: { groupId: string }) => {
      const response = await listEventsByGroupProto({ groupId: request.groupId });
      return {
        events: (response.events || []).map(mapEventResponse),
      };
    },
    getUserEvents: async (_request: { userId: string }) => {
      console.warn('GetUserEvents not implemented in EventService');
      return { events: [] };
    },
    createEvent: async (request) => {
      const response = await createEventProto({
        title: request.title,
        description: request.description || '',
        date: toTimestamp(request.date),
        groupId: request.groupId,
      });

      return mapEventResponse(response);
    },
    updateEvent: async (_request) => {
      console.warn('UpdateEvent not implemented in EventService');
      throw new Error('UpdateEvent not implemented in EventService');
    },
    deleteEvent: async (_request) => {
      console.warn('DeleteEvent not implemented in EventService');
      throw new Error('DeleteEvent not implemented in EventService');
    },
    close: () => grpcClient.close(),
  };
};
