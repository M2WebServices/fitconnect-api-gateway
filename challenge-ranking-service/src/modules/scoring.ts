import { getPool } from "../database/postgres";
import { EventCreatedPayload, WorkoutCompletedPayload } from "../messaging/events";

type TitleName = "ROOKIE" | "BRONZE" | "SILVER" | "GOLD" | "LEGEND";

type Challenge = {
  id: string;
  eventId: string;
  groupId: string;
  title: string;
  createdAt: string;
  pointsReward: number;
};

type ChallengeParticipation = {
  id: string;
  challengeId: string;
  userId: string;
  joinedAt: string;
  completed: boolean;
  completedAt?: string;
};

type UserTitle = {
  userId: string;
  title: TitleName;
  assignedAt: string;
};

const titleByThreshold: Array<{ minScore: number; title: TitleName }> = [
  { minScore: 1500, title: "LEGEND" },
  { minScore: 700, title: "GOLD" },
  { minScore: 300, title: "SILVER" },
  { minScore: 100, title: "BRONZE" },
  { minScore: 0, title: "ROOKIE" },
];

const toIsoString = (value: Date | string | null | undefined): string => {
  if (!value) {
    return new Date().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
};

const getNextTitle = (score: number): TitleName => {
  return titleByThreshold.find((entry) => score >= entry.minScore)?.title ?? "ROOKIE";
};

const getRankByUserId = async (userId: string): Promise<number> => {
  const pool = getPool();
  const result = await pool.query<{ rank: number }>(
    `
    SELECT ranked.rank
    FROM (
      SELECT user_id, RANK() OVER (ORDER BY score DESC, user_id ASC) AS rank
      FROM ranking_scores
    ) AS ranked
    WHERE ranked.user_id = $1
    LIMIT 1
    `,
    [userId]
  );

  if (result.rows[0]?.rank) {
    return Number(result.rows[0].rank);
  }

  const count = await pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM ranking_scores`);
  return Number(count.rows[0]?.count ?? "0") + 1;
};

const getScoreByUserId = async (userId: string): Promise<number> => {
  const pool = getPool();
  const result = await pool.query<{ score: number }>(
    `SELECT score FROM ranking_scores WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  return Number(result.rows[0]?.score ?? 0);
};

const assignTitle = async (userId: string, score: number): Promise<UserTitle> => {
  const pool = getPool();
  const next = getNextTitle(score);

  const current = await pool.query<{ title: TitleName; assigned_at: Date | string }>(
    `SELECT title, assigned_at FROM ranking_titles WHERE user_id = $1 LIMIT 1`,
    [userId]
  );

  if (current.rows[0]?.title === next) {
    return {
      userId,
      title: current.rows[0].title,
      assignedAt: toIsoString(current.rows[0].assigned_at),
    };
  }

  const assignedAt = new Date().toISOString();
  await pool.query(
    `
    INSERT INTO ranking_titles (user_id, title, assigned_at)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id)
    DO UPDATE SET title = EXCLUDED.title, assigned_at = EXCLUDED.assigned_at
    `,
    [userId, next, assignedAt]
  );

  return {
    userId,
    title: next,
    assignedAt,
  };
};

const registerParticipation = async (
  userId: string,
  challengeId: string,
  completedAt: string
): Promise<void> => {
  const pool = getPool();
  const id = `${challengeId}:${userId}`;
  await pool.query(
    `
    INSERT INTO ranking_participations (id, challenge_id, user_id, joined_at, completed, completed_at)
    VALUES ($1, $2, $3, $4, TRUE, $4)
    ON CONFLICT (challenge_id, user_id)
    DO UPDATE SET completed = TRUE, completed_at = EXCLUDED.completed_at
    `,
    [id, challengeId, userId, completedAt]
  );
};

export const addPoints = async (
  userId: string,
  points: number
): Promise<{ userId: string; score: number; rank: number }> => {
  const pool = getPool();
  const result = await pool.query<{ score: number }>(
    `
    INSERT INTO ranking_scores (user_id, score)
    VALUES ($1, $2)
    ON CONFLICT (user_id)
    DO UPDATE SET score = ranking_scores.score + EXCLUDED.score, updated_at = NOW()
    RETURNING score
    `,
    [userId, points]
  );

  const score = Number(result.rows[0]?.score ?? 0);
  await assignTitle(userId, score);
  const rank = await getRankByUserId(userId);

  return { userId, score, rank };
};

export const getLeaderboard = async (
  limit: number
): Promise<Array<{ userId: string; score: number; rank: number }>> => {
  const pool = getPool();
  const safeLimit = Math.max(1, limit || 10);
  const result = await pool.query<{ user_id: string; score: number; rank: number }>(
    `
    SELECT user_id, score, RANK() OVER (ORDER BY score DESC, user_id ASC) AS rank
    FROM ranking_scores
    ORDER BY score DESC, user_id ASC
    LIMIT $1
    `,
    [safeLimit]
  );

  return result.rows.map((row) => ({
    userId: row.user_id,
    score: Number(row.score),
    rank: Number(row.rank),
  }));
};

export const getUserRanking = async (
  userId: string
): Promise<{ userId: string; score: number; rank: number }> => {
  const score = await getScoreByUserId(userId);
  await assignTitle(userId, score);
  const rank = await getRankByUserId(userId);
  return { userId, score, rank };
};

export const getUserTitle = async (userId: string): Promise<UserTitle> => {
  const score = await getScoreByUserId(userId);
  return assignTitle(userId, score);
};

export const getChallenges = async (): Promise<Challenge[]> => {
  const pool = getPool();
  const result = await pool.query<{
    id: string;
    event_id: string;
    group_id: string;
    title: string;
    created_at: Date | string;
    points_reward: number;
  }>(
    `
    SELECT id, event_id, group_id, title, created_at, points_reward
    FROM ranking_challenges
    ORDER BY created_at DESC
    `
  );

  return result.rows.map((row) => ({
    id: row.id,
    eventId: row.event_id,
    groupId: row.group_id,
    title: row.title,
    createdAt: toIsoString(row.created_at),
    pointsReward: Number(row.points_reward),
  }));
};

export const getChallengeParticipations = async (
  challengeId: string
): Promise<ChallengeParticipation[]> => {
  const pool = getPool();
  const result = await pool.query<{
    id: string;
    challenge_id: string;
    user_id: string;
    joined_at: Date | string;
    completed: boolean;
    completed_at: Date | string | null;
  }>(
    `
    SELECT id, challenge_id, user_id, joined_at, completed, completed_at
    FROM ranking_participations
    WHERE challenge_id = $1
    ORDER BY joined_at ASC
    `,
    [challengeId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    challengeId: row.challenge_id,
    userId: row.user_id,
    joinedAt: toIsoString(row.joined_at),
    completed: row.completed,
    completedAt: row.completed_at ? toIsoString(row.completed_at) : undefined,
  }));
};

export const handleWorkoutCompleted = async (payload: WorkoutCompletedPayload): Promise<void> => {
  const pool = getPool();

  const basePoints = 10;
  const durationPoints = Math.floor((payload.durationMinutes ?? 0) / 5);
  const caloriesPoints = Math.floor((payload.caloriesBurned ?? 0) / 50);
  const workoutPoints = Math.max(basePoints, basePoints + durationPoints + caloriesPoints);

  let bonusPoints = 0;
  if (payload.eventId) {
    const challengeId = `event:${payload.eventId}`;
    const challengeResult = await pool.query<{ points_reward: number }>(
      `SELECT points_reward FROM ranking_challenges WHERE id = $1 LIMIT 1`,
      [challengeId]
    );

    if (challengeResult.rows[0]) {
      await registerParticipation(
        payload.userId,
        challengeId,
        payload.completedAt || new Date().toISOString()
      );
      bonusPoints = Number(challengeResult.rows[0].points_reward ?? 0);
    }
  }

  const totalPoints = workoutPoints + bonusPoints;
  await addPoints(payload.userId, totalPoints);
  console.log("[challenge-ranking] WORKOUT_COMPLETED received:", payload);
};

export const handleEventCreated = async (payload: EventCreatedPayload): Promise<void> => {
  const pool = getPool();
  const challengeId = `event:${payload.eventId}`;

  await pool.query(
    `
    INSERT INTO ranking_challenges (id, event_id, group_id, title, created_at, points_reward)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO NOTHING
    `,
    [
      challengeId,
      payload.eventId,
      payload.groupId,
      payload.title,
      payload.createdAt || new Date().toISOString(),
      25,
    ]
  );

  console.log("[challenge-ranking] EVENT_CREATED received:", payload);
};
