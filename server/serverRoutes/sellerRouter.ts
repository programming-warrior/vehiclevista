import { Router } from "express";
import { db } from "../db";
import { users, bids, vehicles, auctions } from "../../shared/schema";
import { eq, or, sql, and, ilike, hasOwnEntityKind } from "drizzle-orm";
import RedisClientSingleton from "../utils/redis";
import { verifyToken } from "../middleware/authMiddleware";

const sellerRouter = Router();

sellerRouter.get("/:sellerId", async (req, res) => {
  const sellerId = req.params.sellerId
    ? Number(req.params.sellerId)
    : undefined;
  if (typeof sellerId === "undefined" || isNaN(sellerId)) {
    return res.status(400).json({ error: "invalid sellerId" });
  }
  const [data] = await db
    .select({
        seller: users,
        vehiclesCount: sql`COUNT(DISTINCT ${vehicles.id})`,
        auctionsCount: sql`COUNT(DISTINCT ${auctions.id})`
    })
    .from(users)
    .where(eq(users.id, sellerId))
    .leftJoin(vehicles, eq(vehicles.sellerId, users.id))
    .leftJoin(auctions, eq(auctions.sellerId, users.id))
    .groupBy(users.id)
    .limit(1);

  if (!data) return res.status(401).json({ error: "No seller found" });

  const sellerData = {
    id: data.seller.id,
    username: data.seller.username,
    businessName: data.seller.businessName,
    businessAddress: data.seller.businessAddress,
    totalVehiclesListed: data.vehiclesCount,
    totalAuctionsListed: data.auctionsCount,
    createdAt: new Date(data.seller.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    })
  };

  return res.status(200).json(sellerData);
});

// Export the router
export default sellerRouter;
