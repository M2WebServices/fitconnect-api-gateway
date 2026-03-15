import { Pool, type PoolConfig } from "pg";
import { env } from "../config/env";

let pool: Pool | null = null;

const createPoolConfig = (): PoolConfig => {
  if (env.databaseUrl) {
    return {
      connectionString: env.databaseUrl,
      ...(env.databaseSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    };
  }

  return {
    host: env.dbHost,
    port: env.dbPort,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName,
    ...(env.databaseSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  };
};

const initializeSchema = async (client: Pool): Promise<void> => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ranking_scores (
      user_id TEXT PRIMARY KEY,
      score INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ranking_titles (
      user_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ranking_challenges (
      id TEXT PRIMARY KEY,
      event_id TEXT UNIQUE NOT NULL,
      group_id TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      points_reward INTEGER NOT NULL DEFAULT 25
    );

    CREATE TABLE IF NOT EXISTS ranking_participations (
      id TEXT PRIMARY KEY,
      challenge_id TEXT NOT NULL REFERENCES ranking_challenges(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      completed_at TIMESTAMPTZ,
      UNIQUE (challenge_id, user_id)
    );
  `);
};

export const initializeDatabase = async (): Promise<void> => {
  if (pool) {
    return;
  }

  const nextPool = new Pool(createPoolConfig());
  await nextPool.query("SELECT 1");
  await initializeSchema(nextPool);
  pool = nextPool;
};

export const getPool = (): Pool => {
  if (!pool) {
    throw new Error("Ranking database is not initialized");
  }

  return pool;
};

export const shutdownDatabase = async (): Promise<void> => {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = null;
};
