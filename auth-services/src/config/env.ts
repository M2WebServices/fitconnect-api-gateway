import dotenv from "dotenv";
import path from "path";

const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

const getNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getBoolean = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === "true";
};

export const env = {
  port: getNumber(process.env.PORT, 4102),
  grpcPort: getNumber(process.env.GRPC_PORT, 5106),
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  databaseUrl: process.env.DATABASE_URL,
  databaseSsl: getBoolean(process.env.DATABASE_SSL, false),
  dbHost: process.env.DATABASE_HOST || "localhost",
  dbPort: getNumber(process.env.DATABASE_PORT, 5432),
  dbUser: process.env.DATABASE_USERNAME || "postgres",
  dbPassword: process.env.DATABASE_PASSWORD || "postgres",
  dbName: process.env.DATABASE_NAME || "fitconnect_auth",
};
