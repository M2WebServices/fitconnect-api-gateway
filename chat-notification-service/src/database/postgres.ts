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
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS chat_notifications (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      user_id TEXT,
      group_id TEXT,
      message TEXT NOT NULL,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    throw new Error("Chat database is not initialized");
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
