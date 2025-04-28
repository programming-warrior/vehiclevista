import { Router } from "express";
import { hashPassword, comparePasswords } from "../utils/auth";
import { db } from "../db";
import { users, bids, vehicles, auctions } from "../../shared/schema";
import { eq, or, sql, sum } from "drizzle-orm";

import { verifyToken } from "../middleware/authMiddleware";

const adminRouter = Router();

interface TopListingType {
  vehicleId: number;
  auctionId?: number;
  title: string;
  description: string;
  clicks: number;
  views: number;
  image_url: string;
  type: "vehicle" | "auction";
  sellerId: number;
  sellerUsername: string;
  sellerEmail: string;
  createdAt: string;
  price: number;
  make: string;
  model: string;
  year: number;
}

adminRouter.get(
  "/analytics/performance-metrics",
  verifyToken,
  async (req, res) => {
    if (!req.userId || req.role !== "admin")
      return res.status(401).json({ error: "unauthorized access" });

    //fetch the total clicks
    const vehicleTotals = await db
      .select({
        count: sql<number>`count(*)`,
        views: sum(vehicles.views).mapWith(Number),
        clicks: sum(vehicles.clicks).mapWith(Number),
      })
      .from(vehicles)
      .execute()
      .then((rows) => rows[0] || { views: 0, clicks: 0 });
    const auctionTotals = await db
      .select({
        count: sql<number>`count(*)`,
        views: sum(auctions.views).mapWith(Number),
        clicks: sum(auctions.clicks).mapWith(Number),
      })
      .from(auctions)
      .execute()
      .then((rows) => rows[0] || { views: 0, clicks: 0 });

    const [{ count: totalUsers }] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(users);

    const performanceMetrics = {
      totalUsers: totalUsers,
      totalVehicles: vehicleTotals.count,
      totalAuctions: auctionTotals.count,
      vehicleTotalViews: vehicleTotals.views,
      vehicleTotalClicks: vehicleTotals.clicks,
      auctionTotalViews: auctionTotals.views,
      auctionTotalClicks: auctionTotals.clicks,
      vehicleTotalLeads: 0,
      auctionTotalLeads: 0,
    };

    return res.status(200).json(performanceMetrics);
  }
);

adminRouter.get("/analytics/top-listings", verifyToken, async (req, res) => {
  if (!req.userId || req.role !== "admin")
    return res.status(401).json({ error: "unauthorized access" });

  //fetch top 5 vehicles and auctions based on views and clicks
  const topVehicles = await db
    .select({
      vehicles,
      users,
    })
    .from(vehicles)
    .innerJoin(users, eq(vehicles.sellerId, users.id))
    .orderBy(sql`${vehicles.clicks} DESC,  ${vehicles.views} DESC`)
    .limit(5);

  const topAuctions = await db
    .select({
      auctions,
      users,
      vehicles,
    })
    .from(auctions)
    .innerJoin(users, eq(auctions.sellerId, users.id))
    .innerJoin(vehicles, eq(auctions.vehicleId, vehicles.id))
    .orderBy(sql`${auctions.clicks} DESC, ${auctions.views} DESC`)
    .limit(5);

  let vehicleIdx = 0;
  let auctionIdx = 0;
  let topListings: TopListingType[] = [];
  while (vehicleIdx < topVehicles.length && auctionIdx < topAuctions.length) {
    if (
      (topVehicles[vehicleIdx].vehicles?.clicks ?? 0) >
      (topAuctions[auctionIdx].auctions?.clicks ?? 0)
    ) {
      topListings.push({
        vehicleId: topVehicles[vehicleIdx].vehicles?.id ?? 0,
        title: topVehicles[vehicleIdx].vehicles?.title,
        clicks: topVehicles[vehicleIdx].vehicles?.clicks ?? 0,
        views: topVehicles[vehicleIdx].vehicles?.views ?? 0,
        type: "vehicle",
        sellerId: topVehicles[vehicleIdx].users.id ?? 0,
        image_url: topVehicles[vehicleIdx].vehicles?.images[0],
        sellerUsername: topVehicles[vehicleIdx].users.username,
        sellerEmail: topVehicles[vehicleIdx].users.email,
        createdAt:
          topVehicles[vehicleIdx].vehicles?.createdAt?.toString() ??
          Date.now().toString(),
        description: topVehicles[vehicleIdx].vehicles?.description,
        price: topVehicles[vehicleIdx].vehicles?.price,
        make: topVehicles[vehicleIdx].vehicles?.make,
        model: topVehicles[vehicleIdx].vehicles?.model,
        year: topVehicles[vehicleIdx].vehicles?.year,
      });
      vehicleIdx++;
    } else if (
      (topVehicles[vehicleIdx].vehicles?.clicks ?? 0) ===
        (topAuctions[auctionIdx].auctions?.clicks ?? 0) &&
      (topVehicles[vehicleIdx].vehicles?.views ?? 0) >=
        (topAuctions[auctionIdx].auctions?.views ?? 0)
    ) {
      topListings.push({
        vehicleId: topVehicles[vehicleIdx].vehicles?.id ?? 0,
        make: topVehicles[vehicleIdx].vehicles?.make,
        model: topVehicles[vehicleIdx].vehicles?.model,
        year: topVehicles[vehicleIdx].vehicles?.year,
        title: topVehicles[vehicleIdx].vehicles?.title,
        clicks: topVehicles[vehicleIdx].vehicles?.clicks ?? 0,
        views: topVehicles[vehicleIdx].vehicles?.views ?? 0,
        image_url: topVehicles[vehicleIdx].vehicles?.images[0],
        type: "vehicle",
        sellerId: topVehicles[vehicleIdx].users.id,
        sellerUsername: topVehicles[vehicleIdx].users.username,
        sellerEmail: topVehicles[vehicleIdx].users.email,
        createdAt:
          topVehicles[vehicleIdx].vehicles?.createdAt?.toString() ??
          Date.now().toString(),
        description: topVehicles[vehicleIdx].vehicles?.description,
        price: topVehicles[vehicleIdx].vehicles?.price,
      });
      vehicleIdx++;
    } else {
      topListings.push({
        auctionId: topAuctions[auctionIdx].auctions?.id,
        make: topVehicles[auctionIdx].vehicles?.make,
        model: topVehicles[auctionIdx].vehicles?.model,
        year: topVehicles[auctionIdx].vehicles?.year,
        title: topAuctions[auctionIdx].auctions?.title,
        clicks: topAuctions[auctionIdx].auctions?.clicks ?? 0,
        views: topAuctions[auctionIdx].auctions?.views ?? 0,
        type: "auction",
        sellerId: topAuctions[auctionIdx].users.id,
        sellerUsername: topAuctions[auctionIdx].users.username,
        sellerEmail: topAuctions[auctionIdx].users.email,
        createdAt:
          topAuctions[auctionIdx].auctions?.createdAt?.toString() ??
          Date.now().toString(),
        description: topAuctions[auctionIdx].auctions?.description,
        image_url: topVehicles[auctionIdx].vehicles?.images[0],
        price: topAuctions[auctionIdx].auctions?.startingPrice,
        vehicleId: topAuctions[auctionIdx].vehicles.id,
      });
    }
  }

  if (auctionIdx < topAuctions.length) {
    for (let i = auctionIdx; i < topAuctions.length; i++) {
      topListings.push({
        auctionId: topAuctions[i].auctions?.id,
        make: topVehicles[i].vehicles?.make,
        model: topVehicles[i].vehicles?.model,
        year: topVehicles[i].vehicles?.year,
        title: topAuctions[i].auctions?.title,
        clicks: topAuctions[i].auctions?.clicks ?? 0,
        views: topAuctions[i].auctions?.views ?? 0,
        type: "auction",
        sellerId: topAuctions[i].users.id,
        sellerUsername: topAuctions[i].users.username,
        sellerEmail: topAuctions[i].users.email,
        createdAt:
          topAuctions[i].auctions?.createdAt?.toString() ??
          Date.now().toString(),
        description: topAuctions[i].auctions?.description,
        image_url: topVehicles[i].vehicles?.images[0],
        price: topAuctions[i].auctions?.startingPrice,
        vehicleId: topAuctions[i].vehicles.id,
      });
    }
  }

  if (vehicleIdx < topVehicles.length) {
    for (let i = vehicleIdx; i < topVehicles.length; i++) {
      topListings.push({
        vehicleId: topVehicles[i].vehicles?.id ?? 0,
        title: topVehicles[i].vehicles?.title,
        clicks: topVehicles[i].vehicles?.clicks ?? 0,
        views: topVehicles[i].vehicles?.views ?? 0,
        type: "vehicle",
        sellerId: topVehicles[i].users.id ?? 0,
        image_url: topVehicles[i].vehicles?.images[0],
        sellerUsername: topVehicles[i].users.username,
        sellerEmail: topVehicles[i].users.email,
        createdAt:
          topVehicles[i].vehicles?.createdAt?.toString() ??
          Date.now().toString(),
        description: topVehicles[i].vehicles?.description,
        price: topVehicles[i].vehicles?.price,
        make: topVehicles[i].vehicles?.make,
        model: topVehicles[i].vehicles?.model,
        year: topVehicles[i].vehicles?.year,
      });
    }
  }

  return res.status(200).json(topListings);
});

// Export the router
export default adminRouter;
