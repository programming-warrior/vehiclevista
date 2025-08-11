import { Router } from "express";
import { hashPassword, comparePasswords } from "../utils/auth";
import { db } from "../db";
import {
  users,
  bids,
  vehicles,
  auctions,
  contactAttempts,
  numberPlate,
  notifications,
  vehicleListingStatus,
  userListingPackages,
  packages,
  auctionStatus,
  vehicleFavourites,
  auctionFavourites,
  Auction,
  recentViews,
} from "../../shared/schema";
import { eq, or, sql, and, ilike, hasOwnEntityKind } from "drizzle-orm";
import { createUserSession, SESSION_EXPIRY_SECONDS } from "../utils/session";
import { userRegisterSchema } from "../../shared/zodSchema/userSchema";
import RedisClientSingleton from "../utils/redis";
import { verifyToken } from "../middleware/authMiddleware";
import { userSessionSchema } from "../utils/session";
import { notificationQueue, cleanupQueue } from "../worker/queue";
import { vehicleEditSchema } from "../../shared/zodSchema/vehicleSchema";
import { MAX_RECENT_VIEW_RECORD_PER_USER } from "../utils/constants";

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

userRouter.get("/listings/classified", verifyToken, async (req, res) => {
  if (!req.userId)
    return res.status(401).json({ error: "unauthorized access" });

  const { page, limit, sortBy, filter } = req.query;
  const pageNumber = parseInt(page as string) || 1;
  const limitNumber = parseInt(limit as string) || 10;
  const offset = (pageNumber - 1) * limitNumber;

  console.log("limit Number: ", limitNumber);
  console.log("pageNumber: ", pageNumber);

  let filterOptions: any = {};
  let searchTerm = "";
  let statusFilter = null;
  let whereClause = [];

  if (filter) {
    try {
      filterOptions = JSON.parse(filter as string);
      searchTerm = filterOptions.search || "";
      statusFilter = filterOptions.status || null;
    } catch (error) {
      console.error("Error parsing filter:", error);
    }
  }

  // Determine sort order
  let orderByClause = sql`${vehicles.createdAt} DESC`;

  if (sortBy === "oldest") {
    orderByClause = sql`${vehicles.createdAt} ASC`;
  } else if (sortBy === "views") {
    orderByClause = sql`${vehicles.views} DESC`;
  } else if (sortBy === "clicks") {
    orderByClause = sql`${vehicles.clicks} DESC`;
  } else if (sortBy === "leads") {
    orderByClause = sql`${vehicles.leads} DESC`;
  }

  // Base query
  let query = db
    .select({
      vehicleId: vehicles.id,
      title: vehicles.title,
      description: vehicles.description,
      openToPx: vehicles.openToPX,
      condition: vehicles.condition,
      negotiable: vehicles.negotiable,
      location: vehicles.location,
      latitude: vehicles.latitude,
      longitude: vehicles.longitude,
      price: vehicles.price,
      createdAt: vehicles.createdAt,
      mileage: vehicles.mileage,
      status: vehicles.listingStatus,
      make: vehicles.make,
      model: vehicles.model,
      images: vehicles.images,
      views: vehicles.views,
      leads: vehicles.leads,
      clicks: vehicles.clicks,
      // Package info
      packageId: userListingPackages.packageId,
      purchasedAt: userListingPackages.purchased_at,
      expiresAt: userListingPackages.expires_at,
      isPackageActive: userListingPackages.is_active,
      packageName: packages.name,
      packageType: packages.type,
      rebookableDays: packages.rebookable_days,
      isUntilSold: packages.is_until_sold,
      isRebookable: packages.is_rebookable,
    })
    .from(vehicles)
    .innerJoin(
      userListingPackages,
      and(eq(userListingPackages.listing_id, vehicles.id))
    )
    .innerJoin(packages, eq(packages.id, userListingPackages.packageId));

  //ONLY RETURNS THE LISTINGS BELONING TO THE USER
  whereClause.push(eq(vehicles.sellerId, req.userId));

  if (searchTerm) {
    whereClause.push(
      or(
        ilike(vehicles.title, `%${searchTerm}%`),
        ilike(vehicles.description, `%${searchTerm}%`)
      )
    );
  }

  if (statusFilter) {
    whereClause.push(eq(vehicles.listingStatus, statusFilter));
  }

  if (whereClause.length > 0) {
    query.where(and(...whereClause));
  }

  const result = await query
    .orderBy(orderByClause)
    .limit(limitNumber + 1)
    .offset(offset);

  let countQuery = db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(vehicles);

  if (whereClause.length > 0) {
    countQuery.where(and(...whereClause));
  }

  console.log("result");
  console.log(result);

  const [{ count: totalVehicles }] = await countQuery;
  console.log("totalVehicles: ", totalVehicles);

  return res.status(200).json({
    listings: result.splice(0, limitNumber),
    totalListings: totalVehicles,
    totalPages: Math.ceil(totalVehicles / limitNumber),
    page: pageNumber,
    hasNextPage: result.length > limitNumber,
  });
});

userRouter.get("/listings/auction", verifyToken, async (req, res) => {
  if (!req.userId)
    return res.status(401).json({ error: "unauthorized access" });

  const { page, limit, sortBy, filter } = req.query;
  const pageNumber = parseInt(page as string) || 1;
  let limitNumber = parseInt(limit as string) || 10;
  limitNumber = Math.max(limitNumber, 100);
  const offset = (pageNumber - 1) * limitNumber;

  let filterOptions: any = {};
  let searchTerm = "";
  let statusFilter = null;
  let whereClause = [];

  if (filter) {
    try {
      filterOptions = JSON.parse(filter as string);
      searchTerm = filterOptions.search || "";
      statusFilter = filterOptions.status || null;
    } catch (error) {
      console.error("Error parsing filter:", error);
    }
  }

  // Determine sort order
  let orderByClause = sql`${auctions.createdAt} DESC`;

  console.log(sortBy);
  console.log(searchTerm);
  console.log(statusFilter);

  if (sortBy === "oldest") {
    orderByClause = sql`${auctions.createdAt} ASC`;
  } else if (sortBy === "views") {
    orderByClause = sql`${auctions.views} DESC`;
  } else if (sortBy === "clicks") {
    orderByClause = sql`${auctions.clicks} DESC`;
  } else if (sortBy === "leads") {
    orderByClause = sql`${auctions.leads} DESC`;
  }

  // Base query
  const query = db
    .select({
      auctionId: auctions.id,
      title: auctions.title,
      description: auctions.description,
      status: auctions.status,
      startDate: auctions.startDate,
      endDate: auctions.endDate,
      currentBid: auctions.currentBid,
      views: auctions.views,
      clicks: auctions.clicks,
      leads: auctions.leads,
      itemId: auctions.itemId,
      itemType: auctions.itemType,
      // Package info
      packageId: userListingPackages.packageId,
      purchasedAt: userListingPackages.purchased_at,
      expiresAt: userListingPackages.expires_at,
      isPackageActive: userListingPackages.is_active,
      packageName: packages.name,
      packageType: packages.type,
      rebookableDays: packages.rebookable_days,
      isUntilSold: packages.is_until_sold,
      isRebookable: packages.is_rebookable,
    })
    .from(auctions)
    .innerJoin(
      userListingPackages,
      and(eq(userListingPackages.listing_id, auctions.id))
    )
    .innerJoin(packages, eq(packages.id, userListingPackages.packageId));

  whereClause.push(eq(auctions.sellerId, req.userId));

  if (searchTerm) {
    whereClause.push(
      or(
        ilike(auctions.title, `%${searchTerm}%`),
        ilike(auctions.description, `%${searchTerm}%`)
      )
    );
  }

  if (statusFilter && auctionStatus.includes(statusFilter)) {
    whereClause.push(eq(auctions.status, statusFilter));
  }

  console.log(whereClause);

  if (whereClause.length > 0) {
    query.where(and(...whereClause));
  }

  const result = await query
    .orderBy(orderByClause)
    .limit(limitNumber + 1)
    .offset(offset);

  let countQuery = db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(auctions);

  if (whereClause.length > 0) {
    countQuery.where(and(...whereClause));
  }

  const [{ count: totalAuctions }] = await countQuery;

  const enhancedListings = await Promise.all(
    result.map(async (auction) => {
      if (auction.itemType === "VEHICLE" && auction.itemId) {
        // Fetch vehicle details
        const [vehicle] = await db
          .select()
          .from(vehicles)
          .where(eq(vehicles.id, auction.itemId));

        return {
          ...auction,
          item: vehicle
            ? {
                type: "VEHICLE",
                registration_num: vehicle.registration_num,
                make: vehicle.make,
                model: vehicle.model,
                year: vehicle.year,
                images: vehicle.images,
              }
            : null,
        };
      } else if (auction.itemType === "NUMBERPLATE" && auction.itemId) {
        // Fetch number plate details
        const [plate] = await db
          .select()
          .from(numberPlate)
          .where(eq(numberPlate.id, auction.itemId));

        return {
          ...auction,
          item: plate
            ? {
                type: "NUMBERPLATE",
                plate_number: plate.plate_number,
                document_url: plate.document_url,
              }
            : null,
        };
      }

      // Return auction without item if itemId is null or type is invalid
      return {
        ...auction,
        item: null,
      };
    })
  );

  return res.status(200).json({
    listings: enhancedListings,
    totalListings: totalAuctions,
    totalPages: Math.ceil(totalAuctions / limitNumber),
    page: pageNumber,
    hasNextPage: result.length > limitNumber,
  });
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
    .innerJoin(vehicles, eq(vehicles.id, auctions.itemId))
    .where(eq(bids.userId, userId))
    .orderBy(sql`${bids.createdAt} DESC`);

  const userbidHistory = result.map((row) => {
    const { bids, auctions, vehicles } = row;
    return {
      id: bids.id,
      auctionId: bids.auctionId,
      auctionTitle: auctions.title,
      auctionStatus: auctions.status,
      vehicleId: auctions.itemId,
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

userRouter.patch(
  "/classified/edit/:vehicleId",
  verifyToken,
  async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: "No user found" });
    const userId = req.userId;
    const payload = vehicleEditSchema.safeParse(req.body);
    if (payload.error) return res.status(400).json(payload.error);
    const { vehicleId } = req.params;
    const vehicleIdNum = parseInt(vehicleId);
    if (!vehicleIdNum || isNaN(vehicleIdNum))
      return res.status(400).json({ error: "invalid input" });
    const vehicleRow = await db
      .select()
      .from(vehicles)
      .where(
        and(
          eq(vehicles.id, vehicleIdNum),
          eq(vehicles.sellerId, userId),
          eq(vehicles.listingStatus, "ACTIVE")
        )
      );

    if (vehicleRow.length === 0)
      return res.status(401).json({ error: "No record found" });

    const currentVehicle = vehicleRow[0];
    const currentImages = currentVehicle.images || [];
    const newImages = payload.data.images || [];

    const imagesToDelete = currentImages.filter(
      (currentImg: string) => !newImages.includes(currentImg)
    );

    const updateResult = await db
      .update(vehicles)
      .set({
        title: payload.data.title,
        description: payload.data.description,
        location: payload.data.location,
        images: payload.data.images,
        openToPX: payload.data.openToPX,
        negotiable: payload.data.negotiable,
        latitude: payload.data.latitude,
        longitude: payload.data.longitude,
      })
      .where(
        and(
          eq(vehicles.id, vehicleIdNum),
          eq(vehicles.sellerId, userId),
          eq(vehicles.listingStatus, "ACTIVE")
        )
      )
      .returning();

    if (updateResult.length === 0)
      return res.status(500).json({
        error: "something went wrong",
      });

    if (imagesToDelete.length > 0) {
      // Don't await this - let it run in background
      cleanupQueue
        .add("delete-s3-images", { image_urls: imagesToDelete })
        .then(() => console.log("added orphaned images to cleanup queue"))
        .catch((e: any) => {
          console.error(e);
        });
    }

    return res.status(201).json({ message: "vehicle udpated" });
  }
);

userRouter.patch(
  "/classified/mark-sold/:listingId",
  verifyToken,
  async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: "No user found" });
    const userId = req.userId;
    const { listingId } = req.params;
    const listingIdNum = parseInt(listingId);
    if (!listingIdNum || isNaN(listingIdNum))
      return res.status(400).json({ error: "invalid input" });
    const vehicleListingRow = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, listingIdNum));

    if (vehicleListingRow.length === 0)
      return res.status(404).json({ error: "vehicle not found" });
    const vehicleListing = vehicleListingRow[0];
    if (vehicleListing.sellerId !== userId)
      return res
        .status(403)
        .json({ error: "You are not authorized to access this notification" });
    if (vehicleListing.listingStatus !== "ACTIVE") {
      return res.status(200).json({ message: "vehicle listing is not ACTIVE" });
    }
    const result = await db
      .update(vehicles)
      .set({ listingStatus: "SOLD" })
      .where(
        and(
          eq(vehicles.id, listingIdNum),
          eq(vehicles.sellerId, userId),
          eq(vehicles.listingStatus, "ACTIVE")
        )
      )
      .returning();
    if (result.length === 0) {
      return res
        .status(400)
        .json({ error: "Could not mark as SOLD. Maybe already expired/sold?" });
    }
    return res
      .status(200)
      .json({ message: "Classified listing marked as sold" });
  }
);

userRouter.patch(
  "/auction/mark-sold/:listingId",
  verifyToken,
  async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: "No user found" });
    const userId = req.userId;
    const { listingId } = req.params;
    const listingIdNum = parseInt(listingId);
    if (!listingIdNum || isNaN(listingIdNum))
      return res.status(400).json({ error: "invalid input" });
    const auctionListingRow = await db
      .select()
      .from(auctions)
      .where(eq(auctions.id, listingIdNum));

    if (auctionListingRow.length === 0)
      return res.status(404).json({ error: "auction not found" });
    const auctionListing = auctionListingRow[0];
    if (auctionListing.sellerId !== userId)
      return res.status(403).json({ error: "You cannot update this auction" });
    if (auctionListing.status !== "RUNNING") {
      return res.status(200).json({ message: "auction  is not RUNNING" });
    }

    const result = await db
      .update(auctions)
      .set({ status: "SOLD" })
      .where(
        and(
          eq(auctions.id, listingIdNum),
          eq(auctions.sellerId, userId),
          eq(auctions.status, "RUNNING")
        )
      )
      .returning();
    if (result.length === 0) {
      return res
        .status(400)
        .json({ error: "Could not mark as SOLD. Maybe already expired/sold?" });
    }
    const auctionIdStr = listingIdNum.toString();
    const redisClient = await RedisClientSingleton.getRedisClient();
    await redisClient.publish(
      "STOP_AUCTION_TIMER",
      JSON.stringify({ auctionId: auctionIdStr })
    );
    return res.status(200).json({ message: "auction listing marked as sold" });
  }
);

userRouter.get("/card-info", verifyToken, async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: "No user found" });
  const userId = req.userId;
  const userRow = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (userRow.length === 0)
    return res.status(401).json({ error: "No user found" });
  const user = userRow[0];
  const cardInfo: any = user.card;
  if (!cardInfo || !cardInfo.paymentMethodId) {
    return res.status(404).json({ error: "Card information not found" });
  }
  return res.status(200).json({
    paymentMethodId: cardInfo.paymentMethodId,
  });
});

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

userRouter.post("/add-to-recent-view", verifyToken, async (req, res) => {
  if (!req.userId) return res.status(403).json({ error: "unauthorized" });

  try {
    let { type, id } = req.body; // type = "classified" or "auction"
    const userId = req.userId;

    if (
      !type ||
      !["classified", "auction"].includes(type.toLowerCase()) ||
      !id
    ) {
      return res
        .status(400)
        .json({ error: "Missing or invalid required fields" });
    }

    type = type.toLowerCase();

    const matchField =
      type === "classified" ? recentViews.classifiedId : recentViews.auctionId;

    await db.transaction(async (trx) => {
      // Get all recent views for this user (oldest first)
      const result = await trx.execute(sql`
              SELECT * FROM ${recentViews} WHERE ${recentViews.userId} = ${userId} 
              ORDER BY ${recentViews.viewedAt}  
              FOR UPDATE
          `);
      const existing: any | null = result?.rows ?? null;
        console.log(existing);
      // Check if record already exists for this item
      const ifExists = existing?.find(
        (e: any) =>
          e.user_id == userId &&
          (type === "classified" ? e.classified_id == id : e.auction_id == id)
      );
      console.log("id: ", id);
      console.log(ifExists)

      if (ifExists) {
        // Update "viewedAt" for existing record
        await trx
          .update(recentViews)
          .set({ viewedAt: new Date() })
          .where(and(eq(recentViews.userId, userId), eq(matchField, id)));
      } else {
        // If user already has max records, delete oldest
        if (existing?.length >= MAX_RECENT_VIEW_RECORD_PER_USER) {
          const oldestRecord = existing[0];
          await trx
            .delete(recentViews)
            .where(eq(recentViews.id, oldestRecord.id));
        }

        // Insert new record
        await trx.insert(recentViews).values({
          userId,
          classifiedId: type === "classified" ? id : null,
          auctionId: type === "auction" ? id : null,
          viewedAt: new Date(),
        });
      }
    });

    // Fetch the saved record after transaction completes
    const savedRecordResult = await db
      .select()
      .from(recentViews)
      .where(and(eq(recentViews.userId, userId), eq(matchField, id)))
      .limit(1);

    const savedRecord = savedRecordResult[0] || null;

    res.json({ success: true, savedRecord });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add recent view" });
  }
});

userRouter.get("/recent-view", verifyToken, async (req, res) => {
  try {
    if (!req.userId) return res.status(403).json({ error: "unauthorized" });
    const result = await db
      .select()
      .from(recentViews)
      .where(eq(recentViews.userId, req.userId))
      .limit(MAX_RECENT_VIEW_RECORD_PER_USER)

    return res.status(200).json(result);
  } catch (err: any) {
    console.error("Error fetching recent view:", err);
    res.status(500).json({ message: "Error fetching recent view" });
    return;
  }
});

userRouter.get("/vehicle-fav", verifyToken, async (req, res) => {
  try {
    if (!req.userId) return res.status(403).json({ error: "unauthorized" });
    const { page = "1", limit = "10" } = req.query;
    const pageNum = parseInt(page as string, 10);
    let pageSize = parseInt(limit as string, 10);
    pageSize = Math.max(pageSize, 50);
    const offset = (pageNum - 1) * pageSize;
    const vehiclesData = await db
      .select({
        vehicle: vehicles,
        favId: vehicleFavourites.id,
      })
      .from(vehicleFavourites)
      .innerJoin(vehicles, eq(vehicleFavourites.vehicleId, vehicles.id))
      .where(eq(vehicleFavourites.userId, req.userId))
      .limit(pageSize + 1)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(vehicleFavourites)
      .where(eq(vehicleFavourites.userId, req.userId));

    return res.status(200).json({
      favourites: vehiclesData.splice(0, pageSize).map((data) => data.vehicle),
      total: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: pageNum,
      hasNextPage: vehiclesData.length > pageSize,
    });
  } catch (err: any) {
    console.error("Error fetching vehicle favourite:", err);
    res.status(500).json({ message: "Error fetching vehicle favourite" });
    return;
  }
});

userRouter.get("/auction-fav", verifyToken, async (req, res) => {
  try {
    if (!req.userId) return res.status(403).json({ error: "unauthorized" });
    const { page = "1", limit = "10" } = req.query;
    const pageNum = parseInt(page as string, 10);
    let pageSize = parseInt(limit as string, 10);
    pageSize = Math.max(pageSize, 50);
    const offset = (pageNum - 1) * pageSize;
    const result = await db
      .select({
        auction: auctions,
        favId: auctionFavourites.id,
      })
      .from(auctionFavourites)
      .innerJoin(auctions, eq(auctionFavourites.auctionId, auctions.id))
      .where(eq(auctionFavourites.userId, req.userId))
      .limit(pageSize + 1)
      .offset(offset);
    console.log(result);

    //get the item data based on  auction itemType
    const auctionData = await Promise.all(
      result.map(async (r) => {
        if (r.auction.itemType === "VEHICLE") {
          const [vehicleData] = await db
            .select()
            .from(vehicles)
            .where(eq(vehicles.id, Number(r.auction.itemId)));

          return {
            ...r.auction,
            remainingTime: new Date(r.auction.endDate).getTime() - Date.now(),
            vehicle: {
              id: vehicleData.id,
              make: vehicleData.make,
              model: vehicleData.model,
              year: vehicleData.year,
              color: vehicleData.color,
              registration_num: vehicleData.registration_num,
              bodyType: vehicleData.bodyType,
              mileage: vehicleData.mileage,
              fuelType: vehicleData.fuelType,
              transmission: vehicleData.transmission,
              price: vehicleData.price,
              images: vehicleData.images,
            },
          };
        } else if (r.auction.itemType === "NUMBER_PLATE") {
          const [numberPlateData] = await db
            .select()
            .from(numberPlate)
            .where(eq(numberPlate.id, Number(r.auction.itemId)));

          return {
            ...r.auction,
            remainingTime: new Date(r.auction.endDate).getTime() - Date.now(),
            numberPlate: {
              id: numberPlateData.id,
              document_urls: numberPlateData.document_url,
              plate_number: numberPlateData.plate_number,
              plate_value: numberPlateData.plate_value,
            },
          };
        }
      })
    );

    console.log(auctionData);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auctionFavourites)
      .where(eq(auctionFavourites.userId, req.userId));

    return res.status(200).json({
      favourites: auctionData,
      total: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: pageNum,
      hasNextPage: auctionData.length > pageSize,
    });
  } catch (err: any) {
    console.error("Error fetching vehicle favourite:", err);
    res.status(500).json({ message: "Error fetching vehicle favourite" });
    return;
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

    if (vehicleRow[0].sellerId === userId)
      return res.status(400).json({ error: "You are the owner" });

    if (vehicleRow[0].listingStatus === "BLACKLISTED")
      return res.status(400).json({ error: "Vehicle is not active" });

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
