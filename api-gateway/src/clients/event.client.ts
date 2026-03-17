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
  joinEvent: (request: { eventId: string; userId: string }) => Promise<any>;
  getEventParticipants: (request: { eventId: string }) => Promise<any>;
  completeWorkoutSession: (request: {
    workoutSessionId: string;
    userId: string;
    completedAt?: string;
    durationMinutes?: number;
    caloriesBurned?: number;
    eventId?: string;
    groupId?: string;
  }) => Promise<any>;
  listUserWorkoutSessions: (request: { userId: string; limit?: number }) => Promise<any>;
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
  console.log('Planning/Event Service client connecting to:', env.grpc.planningServiceUrl);

  const grpcClient = createGrpcClient(
    'event.proto',
    'event',
    'EventService',
    env.grpc.planningServiceUrl
  );

  const { client } = grpcClient;

  const createEventProto = promisifyGrpcCall(client, 'CreateEvent');
  const getEventProto = promisifyGrpcCall(client, 'GetEvent');
  const listEventsByGroupProto = promisifyGrpcCall(client, 'ListEventsByGroup');
  const listEventsByUserProto = promisifyGrpcCall(client, 'ListEventsByUser');
  const updateEventProto = promisifyGrpcCall(client, 'UpdateEvent');
  const deleteEventProto = promisifyGrpcCall(client, 'DeleteEvent');
  const joinEventProto = promisifyGrpcCall(client, 'JoinEvent');
  const getParticipantsProto = promisifyGrpcCall(client, 'GetParticipants');
  const completeWorkoutSessionProto = promisifyGrpcCall(client, 'CompleteWorkoutSession');
  const listUserWorkoutSessionsProto = promisifyGrpcCall(client, 'ListUserWorkoutSessions');

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
    getUserEvents: async (request: { userId: string }) => {
      const response = await listEventsByUserProto({ userId: request.userId });
      return {
        events: (response.events || []).map(mapEventResponse),
      };
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
    updateEvent: async (request) => {
      const payload: {
        id: string;
        title?: string;
        description?: string;
        date?: Timestamp;
        userId: string;
      } = {
        id: request.eventId,
        userId: request.userId,
      };

      if (request.title !== undefined) payload.title = request.title;
      if (request.description !== undefined) payload.description = request.description;
      if (request.date !== undefined) payload.date = toTimestamp(request.date);

      const response = await updateEventProto(payload);
      return mapEventResponse(response);
    },
    deleteEvent: async (request) => {
      return deleteEventProto({
        id: request.eventId,
        userId: request.userId,
      });
    },
    joinEvent: async (request) => {
      return joinEventProto({
        eventId: request.eventId,
        userId: request.userId,
      });
    },
    getEventParticipants: async (request) => {
      return getParticipantsProto({
        eventId: request.eventId,
      });
    },
    completeWorkoutSession: async (request) => {
      return completeWorkoutSessionProto({
        workoutSessionId: request.workoutSessionId,
        userId: request.userId,
        completedAt: request.completedAt,
        durationMinutes: request.durationMinutes,
        caloriesBurned: request.caloriesBurned,
        eventId: request.eventId,
        groupId: request.groupId,
      });
    },
    listUserWorkoutSessions: async (request) => {
      return listUserWorkoutSessionsProto({
        userId: request.userId,
        limit: request.limit,
      });
    },
    close: () => grpcClient.close(),
  };
};
