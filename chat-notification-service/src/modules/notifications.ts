import { getPool } from "../database/postgres";
import { EventCreatedPayload, WorkoutCompletedPayload } from "../messaging/events";
import { broadcastRealtimeEvent } from "../websocket/hub";

type NotificationType = "WORKOUT_COMPLETED" | "EVENT_CREATED";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  userId?: string;
  groupId?: string;
  message: string;
  payload: EventCreatedPayload | WorkoutCompletedPayload;
  createdAt: string;
};

const toIsoString = (value: Date | string): string => {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};

const persistNotification = async (item: NotificationItem): Promise<void> => {
  const pool = getPool();
  await pool.query(
    `
    INSERT INTO chat_notifications (id, type, user_id, group_id, message, payload, created_at)
    VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
    ON CONFLICT (id)
    DO UPDATE SET
      type = EXCLUDED.type,
      user_id = EXCLUDED.user_id,
      group_id = EXCLUDED.group_id,
      message = EXCLUDED.message,
      payload = EXCLUDED.payload,
      created_at = EXCLUDED.created_at
    `,
    [
      item.id,
      item.type,
      item.userId ?? null,
      item.groupId ?? null,
      item.message,
      JSON.stringify(item.payload),
      item.createdAt,
    ]
  );

  await pool.query(`
    DELETE FROM chat_notifications
    WHERE id IN (
      SELECT id
      FROM chat_notifications
      ORDER BY created_at DESC
      OFFSET 200
    )
  `);
};

export const listNotifications = async (): Promise<NotificationItem[]> => {
  const pool = getPool();
  const result = await pool.query<{
    id: string;
    type: NotificationType;
    user_id: string | null;
    group_id: string | null;
    message: string;
    payload: EventCreatedPayload | WorkoutCompletedPayload;
    created_at: Date | string;
  }>(
    `
    SELECT id, type, user_id, group_id, message, payload, created_at
    FROM chat_notifications
    ORDER BY created_at DESC
    LIMIT 200
    `
  );

  return result.rows.map((row) => ({
    id: row.id,
    type: row.type,
    userId: row.user_id ?? undefined,
    groupId: row.group_id ?? undefined,
    message: row.message,
    payload: row.payload,
    createdAt: toIsoString(row.created_at),
  }));
};

export const handleWorkoutCompleted = async (payload: WorkoutCompletedPayload): Promise<void> => {
  const notification: NotificationItem = {
    id: `${payload.workoutSessionId}:${payload.userId}`,
    type: "WORKOUT_COMPLETED",
    userId: payload.userId,
    groupId: payload.groupId,
    message: `Workout completed by user ${payload.userId}`,
    payload,
    createdAt: payload.completedAt || new Date().toISOString(),
  };

  await persistNotification(notification);
  broadcastRealtimeEvent("WORKOUT_COMPLETED", notification);
  console.log("[chat-notification] WORKOUT_COMPLETED received:", payload);
};

export const handleEventCreated = async (payload: EventCreatedPayload): Promise<void> => {
  const notification: NotificationItem = {
    id: payload.eventId,
    type: "EVENT_CREATED",
    groupId: payload.groupId,
    message: `New group event created: ${payload.title}`,
    payload,
    createdAt: payload.createdAt || new Date().toISOString(),
  };

  await persistNotification(notification);
  broadcastRealtimeEvent("EVENT_CREATED", notification);
  console.log("[chat-notification] EVENT_CREATED received:", payload);
};
