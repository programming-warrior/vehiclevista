// redisConnection.ts
import IORedis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

export const connection = new IORedis({
  host: process.env.REDIS_HOSTNAME,
  port: 6379,
  username: "default",
  password: process.env.REDIS_PASSWORD,
  connectTimeout: 30000,
  maxRetriesPerRequest: null,
  retryStrategy: (retries) => Math.min(retries * 100, 3000),
});
