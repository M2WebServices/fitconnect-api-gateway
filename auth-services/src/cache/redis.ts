import { createClient } from "redis";
import { env } from "../config/env";

let redisClient: ReturnType<typeof createClient> | null = null;

const getRedisClient = (): ReturnType<typeof createClient> => {
  if (!redisClient) {
    throw new Error("Redis client not initialized");
  }

  return redisClient;
};

export async function initializeRedis(): Promise<ReturnType<typeof createClient>> {
  if (redisClient) {
    return redisClient;
  }

  const client = createClient({ url: env.redisUrl });

  client.on("error", (error) => {
    console.error("Redis error:", error);
  });

  await client.connect();
  redisClient = client;
  return client;
}

export async function cacheSet(key: string, value: string, expirationSeconds?: number) {
  const client = getRedisClient();

  if (expirationSeconds && expirationSeconds > 0) {
    await client.setEx(key, expirationSeconds, value);
    return;
  }

  await client.set(key, value);
}

export async function cacheGet(key: string): Promise<string | null> {
  const client = getRedisClient();
  return client.get(key);
}

export async function cacheDelete(key: string) {
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
