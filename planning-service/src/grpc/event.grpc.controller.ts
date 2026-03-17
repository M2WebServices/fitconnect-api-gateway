import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { GRPC_ADDRESS, GRPC_INCLUDE_DIRS, GRPC_PROTO_PATH } from "../config/grpc";
import { EventService } from "../modules/event/event.service";
import { ParticipationService } from "../modules/participation/participation.service";
import { WorkoutService } from "../modules/workout/workout.service";
import { fromTimestamp, toEventResponse, toParticipantResponse, toTimestamp } from "./event.mapper";

const packageDefinition = protoLoader.loadSync(GRPC_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  includeDirs: GRPC_INCLUDE_DIRS
});

const proto = grpc.loadPackageDefinition(packageDefinition) as any;

const mapError = (error: unknown): grpc.ServiceError => {
  const message = error instanceof Error ? error.message : "Unknown error";
  if (message === "EVENT_NOT_FOUND") {
    return {
      name: "NotFound",
      message: "Event not found",
      code: grpc.status.NOT_FOUND,
      details: "Event not found",
      metadata: new grpc.Metadata()
    };
  }
  if (message === "ALREADY_JOINED") {
    return {
      name: "AlreadyExists",
      message: "User already joined this event",
      code: grpc.status.ALREADY_EXISTS,
      details: "User already joined this event",
      metadata: new grpc.Metadata()
    };
  }
  return {
    name: "Internal",
    message,
    code: grpc.status.INTERNAL,
    details: message,
    metadata: new grpc.Metadata()
  };
};

export const startGrpcServer = () => {
  const server = new grpc.Server();
  const eventService = new EventService();
  const participationService = new ParticipationService();
  const workoutService = new WorkoutService();

  server.addService(proto.event.EventService.service, {
    CreateEvent: async (
      call: grpc.ServerUnaryCall<
        { title: string; description?: string; date?: { seconds?: number; nanos?: number }; groupId: string },
        unknown
      >,
      callback: grpc.sendUnaryData<unknown>
    ) => {
      try {
        const event = await eventService.createEvent({
          title: call.request.title,
          description: call.request.description,
          date: fromTimestamp(call.request.date),
          groupId: call.request.groupId
        });
        callback(null, toEventResponse(event));
      } catch (error) {
        callback(mapError(error), null);
      }
    },
    GetEvent: async (
      call: grpc.ServerUnaryCall<{ id: string }, unknown>,
      callback: grpc.sendUnaryData<unknown>
    ) => {
      try {
        const event = await eventService.getEvent(call.request.id);
        callback(null, toEventResponse(event));
      } catch (error) {
        callback(mapError(error), null);
      }
    },
    ListEventsByGroup: async (
      call: grpc.ServerUnaryCall<{ groupId: string }, unknown>,
      callback: grpc.sendUnaryData<unknown>
    ) => {
      try {
        const events = await eventService.listEventsByGroup(call.request.groupId);
        callback(null, { events: events.map(toEventResponse) });
      } catch (error) {
        callback(mapError(error), null);
      }
    },
    ListEventsByUser: async (
      call: grpc.ServerUnaryCall<{ userId: string }, unknown>,
      callback: grpc.sendUnaryData<unknown>
    ) => {
      try {
        const events = await eventService.listEventsByUser(call.request.userId);
        callback(null, { events: events.map(toEventResponse) });
      } catch (error) {
        callback(mapError(error), null);
      }
    },
    UpdateEvent: async (
      call: grpc.ServerUnaryCall<
        {
          id: string;
          title?: string;
          description?: string;
          date?: { seconds?: number; nanos?: number };
          userId?: string;
        },
        unknown
      >,
      callback: grpc.sendUnaryData<unknown>
    ) => {
      void call.request.userId;

      try {
        const event = await eventService.updateEvent(call.request.id, {
          title: call.request.title,
          description: call.request.description,
          date: call.request.date ? fromTimestamp(call.request.date) : undefined,
        });
        callback(null, toEventResponse(event));
      } catch (error) {
        callback(mapError(error), null);
      }
    },
    DeleteEvent: async (
      call: grpc.ServerUnaryCall<{ id: string; userId?: string }, unknown>,
      callback: grpc.sendUnaryData<unknown>
    ) => {
      void call.request.userId;

      try {
        const success = await eventService.deleteEvent(call.request.id);
        callback(null, { success });
      } catch (error) {
        callback(mapError(error), null);
      }
    },
    JoinEvent: async (
      call: grpc.ServerUnaryCall<{ eventId: string; userId: string }, unknown>,
      callback: grpc.sendUnaryData<unknown>
    ) => {
      try {
        const participation = await participationService.joinEvent({
          eventId: call.request.eventId,
          userId: call.request.userId
        });
        callback(null, {
          participationId: participation.id,
          joinedAt: toTimestamp(participation.joinedAt)
        });
      } catch (error) {
        callback(mapError(error), null);
      }
    },
    GetParticipants: async (
      call: grpc.ServerUnaryCall<{ eventId: string }, unknown>,
      callback: grpc.sendUnaryData<unknown>
    ) => {
      try {
        const participants = await participationService.listParticipants(call.request.eventId);
        callback(null, {
          participants: participants.map(toParticipantResponse)
        });
      } catch (error) {
        callback(mapError(error), null);
      }
    },
    CompleteWorkoutSession: async (
      call: grpc.ServerUnaryCall<
        {
          workoutSessionId: string;
          userId: string;
          completedAt?: string;
          durationMinutes?: number;
          caloriesBurned?: number;
          eventId?: string;
          groupId?: string;
        },
        unknown
      >,
      callback: grpc.sendUnaryData<unknown>
    ) => {
      try {
        const session = await workoutService.completeWorkoutSession({
          workoutSessionId: call.request.workoutSessionId,
          userId: call.request.userId,
          completedAt: call.request.completedAt,
          durationMinutes: call.request.durationMinutes,
          caloriesBurned: call.request.caloriesBurned,
          eventId: call.request.eventId,
          groupId: call.request.groupId,
        });
        callback(null, session);
      } catch (error) {
        callback(mapError(error), null);
      }
    },
    ListUserWorkoutSessions: async (
      call: grpc.ServerUnaryCall<{ userId: string; limit?: number }, unknown>,
      callback: grpc.sendUnaryData<unknown>
    ) => {
      try {
        const sessions = await workoutService.listUserWorkoutSessions(
          call.request.userId,
          call.request.limit ?? 20
        );
        callback(null, { sessions });
      } catch (error) {
        callback(mapError(error), null);
      }
    }
  });

  server.bindAsync(GRPC_ADDRESS, grpc.ServerCredentials.createInsecure(), (error) => {
    if (error) {
      console.error("Failed to bind gRPC server", error);
      return;
    }
    server.start();
    console.log(`gRPC server listening on ${GRPC_ADDRESS}`);
  });
};
