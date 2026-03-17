import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./env";
import { EventEntity } from "../modules/event/event.model";
import { ParticipationEntity } from "../modules/participation/participation.model";

export const dataSource = new DataSource({
  type: "postgres",
  ...(env.databaseUrl
    ? { url: env.databaseUrl }
    : {
        host: env.dbHost,
        port: env.dbPort,
        username: env.dbUser,
        password: env.dbPassword,
        database: env.dbName,
      }),
  ...(env.databaseSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  entities: [EventEntity, ParticipationEntity],
  synchronize: false
});

export const initializeDatabase = async () => {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS event (
        id UUID PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        date TIMESTAMP NOT NULL,
        group_id UUID NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS participation (
        id UUID PRIMARY KEY,
        event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT participation_event_user_unique UNIQUE (event_id, user_id)
      )
    `);

    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS workout_sessions (
        workout_session_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        completed_at TIMESTAMPTZ NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 0,
        calories_burned INTEGER NOT NULL DEFAULT 0,
        event_id TEXT,
        group_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }
};
