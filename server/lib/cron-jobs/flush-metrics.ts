import { db } from "../../db";
import RedisClientSingleton from "../../utils/redis";
import { vehicles } from "../../../shared/schema";
import { eq, sql } from "drizzle-orm";  

export async function flushMetrics() {
  const redisClient = await RedisClientSingleton.getRedisClient();
  const allKeys = await redisClient.keys("vehicle:*:*");
  const keys = allKeys.filter((key:string) => key.endsWith(":clicks") || key.endsWith(":views"));
  console.log(keys)
  type Metric = "views" | "clicks";
  const allowedMetrics: Metric[] = ["views", "clicks"];

  for (const key of keys) {
    const [_, vehicleId, metric] = key.split(":"); // example: vehicle:123:views
    const value = await redisClient.get(key);
    console.log(value);
    if (!value) continue;

    if (!allowedMetrics.includes(metric as Metric)) continue;

    await db
      .update(vehicles)
      .set({
        [metric]: sql`${vehicles[metric as Metric]} + ${Number(value)}`,
      })
      .where(eq(vehicles.id, Number(vehicleId)));

    await redisClient.del(key);
  }
}

