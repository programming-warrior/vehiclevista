import { Router } from "express";
import { hashPassword, comparePasswords } from "../utils/auth";
import { db } from "../db";
import {
  users,
  bids,
  vehicles,
  auctions,
  contactAttempts,
  notifications,
} from "../../shared/schema";
import { eq, or, sql, and, ilike, hasOwnEntityKind } from "drizzle-orm";
import { createUserSession, SESSION_EXPIRY_SECONDS } from "../utils/session";
import { userRegisterSchema } from "../../shared/zodSchema/userSchema";
import RedisClientSingleton from "../utils/redis";
import { verifyToken } from "../middleware/authMiddleware";
import { userSessionSchema } from "../utils/session";
import { notificationQueue } from "../worker/queue";

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

userRouter.patch(
  "/notifications/mark-read/:notificationId",
  verifyToken,
  async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: "No user found" });
    const userId = req.userId;
    const { notificationId } = req.params;
    const notificationIdNum = parseInt(notificationId);
    if (!notificationIdNum || isNaN(notificationIdNum))
      return res.status(400).json({ error: "invalid input" });
    const notificationRow = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationIdNum))
      .limit(1);
    if (notificationRow.length === 0)
      return res.status(404).json({ error: "Notification not found" });
    const notification = notificationRow[0];
    if (notification.sentTo !== userId)
      return res
        .status(403)
        .json({ error: "You are not authorized to access this notification" });
    if (notification.isRead) {
      return res
        .status(200)
        .json({ message: "Notification already marked as read" });
    }
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationIdNum));
    return res.status(200).json({ message: "Notification marked as read" });
  }
);

userRouter.get("/notifications", verifyToken, async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: "No user found" });
  const userId = req.userId;
  const { page = 1, limit = 10, filter, sortBy } = req.query;
  const pageNumber = parseInt(page as string) || 1;
  let limitNumber = parseInt(limit as string) || 10;
  limitNumber = Math.min(limitNumber, 100); // Limit to a maximum of 100 notifications per request
  const offset = (pageNumber - 1) * limitNumber;

  let filterOptions: any = {};
  let type = "";
  let is_read: boolean | null = null;
  let searchTerm = "";

  let whereClause = [];
  if (filter) {
    try {
      filterOptions = JSON.parse(filter as string);
      type = filterOptions.type || "";
      is_read = filterOptions.is_read || null;
      searchTerm = filterOptions.searchTerm || "";
    } catch (error) {
      console.error("Error parsing filter:", error);
    }
  }

  let sortOrder = sql`${notifications.createdAt} DESC`; // Default sort order

  if (sortBy === "oldest") {
    sortOrder = sql`${notifications.createdAt} ASC`;
  }

  try {
    const query = db.select().from(notifications);

    whereClause.push(eq(notifications.sentTo, userId));
    if (type && type.toLowerCase() !== "all") {
      whereClause.push(eq(notifications.type, type));
    }
    if (is_read !== null) {
      whereClause.push(eq(notifications.isRead, is_read));
    }
    if (searchTerm) {
      whereClause.push(
        or(
          ilike(notifications.type, `%${searchTerm}%`),
          sql`CAST(${notifications.message} AS TEXT) ILIKE ${
            "%" + searchTerm + "%"
          }`
        )
      );
    }
    if (whereClause.length > 0) {
      query.where(and(...whereClause));
    }

    query.orderBy(sortOrder);
    query.limit(limitNumber).offset(offset);

    const ntf = await query;

    let countQuery = db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(notifications);

    if (whereClause.length > 0) {
      countQuery.where(and(...whereClause));
    }
    let unReadNotificationsQuery = db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(notifications)
      .where(
        and(eq(notifications.sentTo, userId), eq(notifications.isRead, false))
      );
    const [{ count: totalNotifications }] = await countQuery;
    const [{ count: unreadNotificationsCount }] =
      await unReadNotificationsQuery;

    const formattedNotifications = ntf.map((n) => ({
      id: n.id,
      message: n.message,
      isRead: n.isRead,
      type: n.type,
      createdAt: n.createdAt,
    }));

    return res.status(200).json({
      notifications: formattedNotifications,
      totalPages: Math.ceil(totalNotifications / limitNumber),
      hasNextPage: offset + limitNumber < totalNotifications,
      totalNotifications,
      unreadNotificationsCount,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

userRouter.post("/contact-seller", verifyToken, async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: "No user found" });
  const userId = req.userId;
  let { vehicleId, message } = req.body;
  vehicleId = parseInt(vehicleId);
  if (!vehicleId || !message || isNaN(vehicleId) || message.trim() === "")
    return res.status(400).json({ error: "invalid input" });
  if (message.length > 1000)
    return res.status(400).json({ error: "Message too long" });
  if (message.length < 10)
    return res.status(400).json({ error: "Message too short" });
  try {
    const redisClient = await RedisClientSingleton.getRedisClient();
    const redisKey = `contact-seller:${userId}:${vehicleId}`;
    const alreadyContacted = await redisClient.get(redisKey);
    if (alreadyContacted)
      return res.status(400).json({
        error: "You have already contacted the seller for this vehicle",
      });

    const vehicleRow = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, vehicleId))
      .limit(1);
    if (vehicleRow.length === 0)
      return res.status(401).json({ error: "No vehicle found" });

    const messageRow = await db
      .insert(contactAttempts)
      .values({
        userId,
        vehicleId,
        sellerId: vehicleRow[0].sellerId,
        message,
      })
      .returning();

    await notificationQueue.add("contact-seller", {
      messageId: messageRow[0].id,
      userId,
      vehicleId,
      sellerId: vehicleRow[0].sellerId,
      message,
    });
    //buyer can contact seller only once in 6 hours
    redisClient.set(redisKey, "1", "EX", 6 * 60 * 60);
    return res.status(200).json({ message: "message sent successfully" });
  } catch (e) {
    console.error("Error in contact-seller route:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
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
