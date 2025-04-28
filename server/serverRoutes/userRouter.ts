import { Router } from "express";
import { hashPassword, comparePasswords } from "../utils/auth";
import { db } from "../db";
import { users, bids, vehicles, auctions } from "../../shared/schema";
import { eq, or, sql } from "drizzle-orm";
import { createUserSession, SESSION_EXPIRY_SECONDS } from "../utils/session";
import { userRegisterSchema } from "../../shared/zodSchema/userSchema";
import RedisClientSingleton from "../utils/redis";
import { verifyToken } from "../middleware/authMiddleware";
import { StringRouteParams } from "wouter";
import { userSessionSchema } from "../utils/session";

const userRouter = Router();

userRouter.get("/", verifyToken, async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: "No user found" });
  const userId = req.userId;
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (user.length === 0)
    return res.status(401).json({ error: "No user found" });
  const { ...userData } = user[0];

  //fetch total bids
  const [{ count: totalBids }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(bids)
    .where(eq(bids.userId, userId))
    .limit(1);

  const dashboardData = {
    userId: userData.id,
    role: userData.role,
    username: userData.username,
    email: userData.email,
    card_verified: (userData.card as any).paymentMethodId ? true : false,
    totalBids: totalBids,
    memberSince: new Date(userData.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    }),
  };

  return res.status(200).json(dashboardData);
});

userRouter.get("/bids", verifyToken, async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: "No user found" });
  const userId = req.userId;

  //fetch total bids
  const result = await db
    .select({
      bids,
      auctions,
      vehicles,
    })
    .from(bids)
    .innerJoin(auctions, eq(auctions.id, bids.auctionId))
    .innerJoin(vehicles, eq(vehicles.id, auctions.vehicleId))
    .where(eq(bids.userId, userId))
    .orderBy(sql`${bids.createdAt} DESC`);

  const userbidHistory = result.map((row) => {
    const { bids, auctions, vehicles } = row;
    return {
      id: bids.id,
      auctionId: bids.auctionId,
      auctionTitle: auctions.title,
      auctionStatus: auctions.status,
      vehicleId: auctions.vehicleId,
      vehicleTitle: vehicles.title,
      vehicleMake: vehicles.make,
      vehicleModel: vehicles.model,
      vehicleYear: vehicles.year,
      bidAmount: bids.bidAmount,
      createdAt: bids.createdAt
        ? new Date(bids.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : null,
    };
  });
  return res.status(200).json(userbidHistory);
});

userRouter.patch("/change-password", verifyToken, async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: "No user found" });
  const userId = req.userId;
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword)
    return res.status(400).json({ error: "invalid input" });
  const userRow = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (userRow.length === 0)
    return res.status(401).json({ error: "No user found" });

  const user = userRow[0];
  const match = await comparePasswords(oldPassword, user.password);
  if (!match) return res.status(401).json({ error: "Password not matched" });

  const hashedPassword: string = await hashPassword(newPassword);
  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, userId));

  return res.status(200).json({ message: "Password updated successfully" });
});

userRouter.patch("/card-info", verifyToken, async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: "No user found" });
  const userId = req.userId;
  const { paymentMethodId } = req.body;
  if (!paymentMethodId) return res.status(400).json({ error: "invalid input" });

  await db
    .update(users)
    .set({ card: { paymentMethodId } })
    .where(eq(users.id, userId));

  return res.status(200).json({ message: "Card updated successfully" });
});

// Export the router
export default userRouter;
