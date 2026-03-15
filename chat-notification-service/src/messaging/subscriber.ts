import { createClient } from "redis";
import { env } from "../config/env";
import { handleEventCreated, handleWorkoutCompleted } from "../modules/notifications";
import {
  EventCreatedPayload,
  REDIS_CHANNELS,
  WorkoutCompletedPayload,
} from "./events";

let redisSubscriber: ReturnType<typeof createClient> | null = null;

export const initializeSubscriber = async (): Promise<void> => {
  if (redisSubscriber) {
    return;
  }

  const subscriber = createClient({
    url: env.redisUrl,
    socket: {
      reconnectStrategy: false,
      connectTimeout: 2000,
    },
  });
  subscriber.on("error", (error) => {
    console.error("Redis subscriber error:", error);
  });

  try {
    await subscriber.connect();
  } catch (error) {
    console.warn("Redis is unavailable, subscriptions are disabled", error);
    return;
  }

  await subscriber.subscribe(REDIS_CHANNELS.workoutCompleted, async (message) => {
    try {
      const payload = JSON.parse(message) as WorkoutCompletedPayload;
      await handleWorkoutCompleted(payload);
    } catch (error) {
      console.warn("Invalid WORKOUT_COMPLETED payload", error);
    }
  });

  await subscriber.subscribe(REDIS_CHANNELS.eventCreated, async (message) => {
    try {
      const payload = JSON.parse(message) as EventCreatedPayload;
      await handleEventCreated(payload);
    } catch (error) {
      console.warn("Invalid EVENT_CREATED payload", error);
    }
  });

  redisSubscriber = subscriber;
  console.log(`Redis subscriber connected on ${env.redisUrl}`);
};

export const shutdownSubscriber = async (): Promise<void> => {
  if (!redisSubscriber) {
    return;
  }

  try {
    await redisSubscriber.quit();
  } catch (error) {
    console.warn("Failed to close Redis subscriber cleanly", error);
  } finally {
    redisSubscriber = null;
  }
};
