import { db } from "../../db";
import RedisClientSingleton from "../../utils/redis";
import { vehicleMetricsHistory, auctionMetricsHistory, vehicles, auctions} from "../../../shared/schema";

export async function FlushPastPerformanceMetrics(date: Date) {
  
  const promise_vehicles= db.select().from(vehicles)
  const promise_auctions = db.select().from(auctions);

  const [_vehicles, _auctions] = await Promise.all([promise_vehicles, promise_auctions]);

  const vehicleMetrics = _vehicles.map((v)=>{
    return {
      vehicleId: v.id,
      views: v.views ?? 0,
      clicks: v.clicks ?? 0,
      leads: v.leads ?? 0, 
      recroded_at: date
    }
  }) 

  const auctionMetrics = _auctions.map((a)=>{
    return {
        auctionId: a.id,
        views: a.views ?? 0,
        clicks: a.clicks ?? 0,
        leads: a.leads ?? 0, 
        recorded_at: date
    }
  })
  
  db.insert(vehicleMetricsHistory).values(vehicleMetrics);
  db.insert(auctionMetricsHistory).values(auctionMetrics)
}

