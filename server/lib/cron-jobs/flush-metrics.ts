import { db } from "../../db";
import RedisClientSingleton from "../../utils/redis";
import { vehicles, raffle } from "../../../shared/schema";
import { eq, sql } from "drizzle-orm";  

export async function flushMetrics() {
  const redisClient = await RedisClientSingleton.getRedisClient();
  const allVehicleKeys = await redisClient.keys("vehicle:*:*");
  const allRaffleKeys = await redisClient.keys("raffle:*:*"); 

  const vehicleKeys = allVehicleKeys.filter((key:string) => key.endsWith(":clicks") || key.endsWith(":views"));
  const raffleKeys = allRaffleKeys.filter((key:string) => key.endsWith(":clicks") || key.endsWith(":views"));

  // console.log(vehilceKeys)
  console.log(raffleKeys)
  console.log(vehicleKeys)
  type Metric = "views" | "clicks";
  const allowedMetrics: Metric[] = ["views", "clicks"];

  for (const key of vehicleKeys) {
    const [_, vehicleId, metric] = key.split(":"); // example: vehicle:123:views

    if(isNaN(parseInt(vehicleId))) {
      await redisClient.del(key);
      continue;
    }
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

  for (const key of raffleKeys) {
    const [_, raffleId, metric] = key.split(":"); 
    if(isNaN(parseInt(raffleId))) {
      await redisClient.del(key);
      continue;
    }
    const value = await redisClient.get(key);
    console.log(value);
    if (!value) continue;

    if (!allowedMetrics.includes(metric as Metric)) continue;

    await db
      .update(raffle)
      .set({
        [metric]: sql`${raffle[metric as Metric]} + ${Number(value)}`,
      })
      .where(eq(raffle.id, Number(raffleId)));

    await redisClient.del(key);
  }
}

