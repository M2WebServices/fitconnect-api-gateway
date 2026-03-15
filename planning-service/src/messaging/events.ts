export const REDIS_CHANNELS = {
  eventCreated: "EVENT_CREATED",
  workoutCompleted: "WORKOUT_COMPLETED",
} as const;

export type EventCreatedPayload = {
  eventId: string;
  groupId: string;
  title: string;
  date: string;
  createdAt: string;
};

export type WorkoutCompletedPayload = {
  userId: string;
  workoutSessionId: string;
  completedAt: string;
  durationMinutes?: number;
  caloriesBurned?: number;
};
