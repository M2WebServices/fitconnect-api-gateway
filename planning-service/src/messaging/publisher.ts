import { createClient } from "redis";
import { env } from "../config/env";
import { EventCreatedPayload, REDIS_CHANNELS, WorkoutCompletedPayload } from "./events";

let redisPublisher: ReturnType<typeof createClient> | null = null;

export const initializePublisher = async (): Promise<void> => {
  if (redisPublisher) {
    return;
  }

  const client = createClient({ url: env.redisUrl });

  client.on("error", (error) => {
    console.error("Redis publisher error:", error);
  });

  try {
    await client.connect();
    redisPublisher = client;
    console.log(`Redis publisher connected on ${env.redisUrl}`);
  } catch (error) {
    console.warn("Redis is unavailable, events will not be published", error);
    redisPublisher = null;
  }
};

const publish = async (channel: string, payload: unknown): Promise<void> => {
  if (!redisPublisher) {
    return;
  }

  await redisPublisher.publish(channel, JSON.stringify(payload));
};

export const publishEventCreated = async (payload: EventCreatedPayload): Promise<void> => {
  await publish(REDIS_CHANNELS.eventCreated, payload);
};

export const publishWorkoutCompleted = async (
  payload: WorkoutCompletedPayload
): Promise<void> => {
  await publish(REDIS_CHANNELS.workoutCompleted, payload);
};

export const shutdownPublisher = async (): Promise<void> => {
  if (!redisPublisher) {
    return;
  }

  try {
    await redisPublisher.quit();
  } catch (error) {
    console.warn("Failed to close Redis publisher cleanly", error);
  } finally {
    redisPublisher = null;
  }
};
