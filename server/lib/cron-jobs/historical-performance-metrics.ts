import { db } from "../../db";
import { vehicles, auctions, users, platformSummaryHistory } from "../../../shared/schema";
import { sql, sum } from "drizzle-orm";

export async function flushAndAggregateMetrics() {
  console.log("Running analytics aggregation job...");
  try {
    // 1. Get current totals for everything in parallel for efficiency
    const vehicleTotalsPromise = db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
        views: sum(vehicles.views).mapWith(Number),
        clicks: sum(vehicles.clicks).mapWith(Number),
        leads: sum(vehicles.leads).mapWith(Number),
      })
      .from(vehicles);

    const auctionTotalsPromise = db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
        views: sum(auctions.views).mapWith(Number),
        clicks: sum(auctions.clicks).mapWith(Number),
        leads: sum(auctions.leads).mapWith(Number),
      })
      .from(auctions);

    const userTotalPromise = db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(users);

    const [[vehicleTotals], [auctionTotals], [userTotal]] = await Promise.all([
      vehicleTotalsPromise,
      auctionTotalsPromise,
      userTotalPromise,
    ]);

    // 2. Prepare the new summary record
    const newSummary = {
      recorded_at: new Date(),
      total_vehicles: vehicleTotals.count || 0,
      total_auctions: auctionTotals.count || 0,
      total_users: userTotal.count || 0,
      total_vehicle_views: vehicleTotals.views || 0,
      total_vehicle_clicks: vehicleTotals.clicks || 0,
      total_vehicle_leads: vehicleTotals.leads || 0,
      total_auction_views: auctionTotals.views || 0,
      total_auction_clicks: auctionTotals.clicks || 0,
      total_auction_leads: auctionTotals.leads || 0,
    };

    // 3. Insert the new summary into the history table
    await db.insert(platformSummaryHistory).values(newSummary);

    console.log("Successfully flushed and aggregated platform metrics.");
  } catch (error) {
    console.error("Error running analytics aggregation job:", error);
  }
}