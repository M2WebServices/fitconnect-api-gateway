import { dataSource } from "../../config/database";
import { publishWorkoutCompleted } from "../../messaging/publisher";

export type CompleteWorkoutInput = {
  workoutSessionId: string;
  userId: string;
  completedAt?: string;
  durationMinutes?: number;
  caloriesBurned?: number;
  eventId?: string;
  groupId?: string;
};

export type WorkoutSessionDto = {
  workoutSessionId: string;
  userId: string;
  completedAt: string;
  durationMinutes: number;
  caloriesBurned: number;
  eventId: string;
  groupId: string;
};

const normalizeNumber = (value: number | undefined): number => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
};

const rowToDto = (row: {
  workout_session_id: string;
  user_id: string;
  completed_at: Date | string;
  duration_minutes: number | null;
  calories_burned: number | null;
  event_id: string | null;
  group_id: string | null;
}): WorkoutSessionDto => ({
  workoutSessionId: row.workout_session_id,
  userId: row.user_id,
  completedAt: new Date(row.completed_at).toISOString(),
  durationMinutes: Number(row.duration_minutes ?? 0),
  caloriesBurned: Number(row.calories_burned ?? 0),
  eventId: row.event_id ?? "",
  groupId: row.group_id ?? "",
});

export class WorkoutService {
  async completeWorkoutSession(input: CompleteWorkoutInput): Promise<WorkoutSessionDto> {
    const completedAt = input.completedAt || new Date().toISOString();

    const rows = await dataSource.query(
      `
      INSERT INTO workout_sessions (
        workout_session_id,
        user_id,
        completed_at,
        duration_minutes,
        calories_burned,
        event_id,
        group_id
      )
      VALUES ($1, $2, $3::timestamptz, $4, $5, NULLIF($6, ''), NULLIF($7, ''))
      ON CONFLICT (workout_session_id)
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        completed_at = EXCLUDED.completed_at,
        duration_minutes = EXCLUDED.duration_minutes,
        calories_burned = EXCLUDED.calories_burned,
        event_id = EXCLUDED.event_id,
        group_id = EXCLUDED.group_id
      RETURNING workout_session_id, user_id, completed_at, duration_minutes, calories_burned, event_id, group_id
      `,
      [
        input.workoutSessionId,
        input.userId,
        completedAt,
        normalizeNumber(input.durationMinutes),
        normalizeNumber(input.caloriesBurned),
        input.eventId ?? "",
        input.groupId ?? "",
      ]
    );

    const session = rowToDto(rows[0]);

    await publishWorkoutCompleted({
      userId: session.userId,
      workoutSessionId: session.workoutSessionId,
      completedAt: session.completedAt,
      durationMinutes: session.durationMinutes,
      caloriesBurned: session.caloriesBurned,
      eventId: session.eventId || undefined,
      groupId: session.groupId || undefined,
    });

    return session;
  }

  async listUserWorkoutSessions(userId: string, limit = 20): Promise<WorkoutSessionDto[]> {
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 20;
    const rows = await dataSource.query(
      `
      SELECT workout_session_id, user_id, completed_at, duration_minutes, calories_burned, event_id, group_id
      FROM workout_sessions
      WHERE user_id = $1
      ORDER BY completed_at DESC
      LIMIT $2
      `,
      [userId, safeLimit]
    );

    return rows.map(rowToDto);
  }
}