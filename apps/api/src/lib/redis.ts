import { Redis } from "ioredis";

let connection: Redis | null = null;

/**
 * Get a singleton ioredis connection for BullMQ and rate limiting.
 * Falls back to localhost:6379 if REDIS_URL is not set.
 */
export function getRedisConnection(): Redis {
  if (!connection) {
    connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null, // Required by BullMQ
      retryStrategy(times: number) {
        if (times > 5) return null;
        return Math.min(times * 200, 2000);
      },
    });

    connection.on("error", (err: Error) => {
      console.error("[Redis] Connection error:", err.message);
    });
  }
  return connection;
}

/**
 * Close the Redis connection (for graceful shutdown).
 */
export async function closeRedisConnection(): Promise<void> {
  if (connection) {
    await connection.quit();
    connection.disconnect();
    connection = null;
  }
}
