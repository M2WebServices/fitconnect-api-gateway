import dotenv from "dotenv";
import path from "path";

const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

const getNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getBoolean = (value: string | undefined, fallback = false) => {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === "true";
};

export const env = {
  httpPort: getNumber(process.env.HTTP_PORT, 4103),
  grpcPort: getNumber(process.env.GRPC_PORT, 5103),
  databaseUrl: process.env.DATABASE_URL,
  databaseSsl: getBoolean(process.env.DATABASE_SSL, false),
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: getNumber(process.env.DB_PORT, 5432),
  dbUser: process.env.DB_USER || "postgres",
  dbPassword: process.env.DB_PASSWORD || "postgres",
  dbName: process.env.DB_NAME || "planning_service",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379"
};
