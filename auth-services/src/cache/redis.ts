import { createClient } from "redis";
import { env } from "../config/env";

let redisClient: ReturnType<typeof createClient> | null = null;
let redisDisabled = false;

const getRedisClient = (): ReturnType<typeof createClient> => {
  if (!redisClient) {
    throw new Error("Redis client not initialized");
  }

  return redisClient;
};

export async function initializeRedis(): Promise<ReturnType<typeof createClient>> {
  if (redisDisabled) {
    throw new Error("Redis cache is disabled");
  }

  if (redisClient) {
    return redisClient;
  }

  const client = createClient({
    url: env.redisUrl,
    socket: {
      reconnectStrategy: false,
    },
  });

  client.on("error", (error) => {
    console.error("Redis error:", error);
  });

  try {
    await client.connect();
    redisClient = client;
    return client;
  } catch (error) {
    redisDisabled = true;
    try {
      client.disconnect();
    } catch {
      // ignore disconnect errors when connection was never established
    }
    console.warn(`Redis unavailable on ${env.redisUrl}, continuing without cache`);
    throw error;
  }
}

export async function cacheSet(key: string, value: string, expirationSeconds?: number) {
  if (!redisClient || redisDisabled) {
    return;
  }

  const client = getRedisClient();

  if (expirationSeconds && expirationSeconds > 0) {
    await client.setEx(key, expirationSeconds, value);
    return;
  }

  await client.set(key, value);
}

export async function cacheGet(key: string): Promise<string | null> {
  if (!redisClient || redisDisabled) {
    return null;
  }

  const client = getRedisClient();
  return client.get(key);
}

export async function cacheDelete(key: string) {
  if (!redisClient || redisDisabled) {
    return;
  }

  const client = getRedisClient();
  await client.del(key);
}

export async function disconnectRedis() {
  if (!redisClient) {
    return;
  }

  await redisClient.quit();
  redisClient = null;
}
