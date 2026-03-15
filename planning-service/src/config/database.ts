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
  }
};
