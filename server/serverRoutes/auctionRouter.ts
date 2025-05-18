import { Router } from "express";
import { db } from "../db";
import { auctions, Vehicle, vehicles, bids,users } from "../../shared/schema";
import { eq, lte, or, gte, and, sql, inArray } from "drizzle-orm";
import RedisClientSingleton from "../utils/redis";
import axios from "axios";
import { vehicleUploadSchema } from "../../shared/zodSchema/vehicleSchema";
import { z } from "zod";
import { verifyToken } from "../middleware/authMiddleware";
import { parseCsvFile, extractVehicles } from "../utils/helper";
import multer from "multer";
import { auctionQueue, bidQueue } from "../worker/queue";
import { vehicleTypesEnum } from "../../shared/schema";

// const redisClient = RedisClientSingleton.getInstance().getRedisClient();

const upload = multer();

const auctionRouter = Router();

auctionRouter.get("/get", async (req, res) => {
  try {
    const { brand, model, page = "1", limit = "10", type } = req.query;

    const conditions = [eq(auctions.status, "RUNNING")];

    if (brand && !/all/gi.test(brand as string))
      conditions.push(eq(vehicles.make, String(brand)));
    if (model && !/all/gi.test(model as string))
      conditions.push(eq(vehicles.model, String(model)));
    // Only filter by type if provided and valid
    if (
      type &&
      vehicleTypesEnum.enumValues.includes(
        String(type).toLocaleLowerCase() as (typeof vehicleTypesEnum.enumValues)[number]
      )
    ) {
      conditions.push(
        eq(
          vehicles.type,
          String(type).toLocaleLowerCase() as (typeof vehicleTypesEnum.enumValues)[number]
        )
      );
    }

    const pageNum = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * pageSize;

    const result = await db
      .select({
        auction: auctions,
        vehicle: vehicles,
      })
      .from(auctions)
      .innerJoin(vehicles, eq(auctions.vehicleId, vehicles.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .limit(pageSize + 1)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auctions)
      .innerJoin(vehicles, eq(auctions.vehicleId, vehicles.id))
      .where(conditions.length ? and(...conditions) : undefined);

    const auctionsWithVehicleDetails = result.map((row) => {
      const auction = row.auction as any;
      const vehicle = row.vehicle as Vehicle;
      return {
        ...auction,
        remainingTime: new Date(auction.endDate).getTime() - Date.now(),
        vehicle: {
          id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color,
          registration_num: vehicle.registration_num,
          bodyType: vehicle.bodyType,
          mileage: vehicle.mileage,
          fuelType: vehicle.fuelType,
          transmission: vehicle.transmission,
          price: vehicle.price,
          images: vehicle.images,
        },
      };
    });

    res.status(200).json({
      auctions: auctionsWithVehicleDetails,
      totalCount: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: pageNum,
      hasNextPage: result.length > pageSize,
    });
  } catch (err: any) {
    console.error("Error fetching vehicles:", err);
    res
      .status(500)
      .json({ message: "Error fetching vehicle list", error: err.message });
  }
});

auctionRouter.get("/get/:id", async (req, res) => {
  try {
    const auctionId = parseInt(req.params.id, 10);
    if (isNaN(auctionId)) {
      return res.status(400).json({ error: "Invalid auction ID" });
    }

    const result = await db
      .select({
        auction: auctions,
        vehicle: vehicles,
      })
      .from(auctions)
      .innerJoin(vehicles, eq(auctions.vehicleId, vehicles.id))
      .where(eq(auctions.id, auctionId));

    if (!result.length) {
      return res.status(404).json({ error: "Auction not found" });
    }

    const row = result[0];
    const auction = row.auction as any;
    const vehicle = row.vehicle as Vehicle;

    const auctionWithVehicleDetails = {
      ...auction,
      remainingTime: new Date(auction.endDate).getTime() - Date.now(),
      vehicle: {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        registration_num: vehicle.registration_num,
        bodyType: vehicle.bodyType,
        mileage: vehicle.mileage,
        fuelType: vehicle.fuelType,
        transmission: vehicle.transmission,
        price: vehicle.price,
        images: vehicle.images,
      },
    };

    res.status(200).json(auctionWithVehicleDetails);
  } catch (err: any) {
    console.error("Error fetching auction:", err);
    res
      .status(500)
      .json({ message: "Error fetching auction", error: err.message });
  }
});

auctionRouter.post(
  "/place/live-bid/:auctionId",
  verifyToken,
  async (req, res) => {
    if (!req.userId || !req.card_verified) return res.status(403).json({ error: "Unauthorized" });
    try {
      const auctionId = parseInt(req.params.auctionId, 10);
      if (isNaN(auctionId)) {
        return res.status(400).json({ error: "Invalid auction ID" });
      }
      let { bidAmount } = req.body;
      bidAmount = parseFloat(bidAmount);
      if (!bidAmount || isNaN(bidAmount) || bidAmount< 0) {
        return res.status(400).json({ error: "invalid bidAmount" });
      }

      await bidQueue.add('processBid', { auctionId, userId: req.userId, bidAmount })

      return res.status(202).json({ message: "Bid queued" });
    } catch (e: any) {
      if (e.message === "auction not found") {
        return res.status(404).json({ error: e.message });
      }
      if (e.message === "bidAmount needs to be greater than the currentBid") {
        return res.status(400).json({ error: e.message });
      }
      console.log(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

auctionRouter.get(
  "/bids/:auctionId",
  async (req, res) => {
    try {
      const auctionId = parseInt(req.params.auctionId, 10);
      if (isNaN(auctionId)) {
        return res.status(400).json({ error: "Invalid auction ID" });
      }

      const result = await db
        .select({
          bid: bids,
          user: {
            id: users.id,
            username: users.username,
          }
        })
        .from(bids)
        .innerJoin(users, eq(bids.userId, users.id))
        .where(eq(bids.auctionId, auctionId))
        .orderBy(sql`${bids.createdAt} DESC`);

      const bidsWithUser = result.map(row => ({
        ...row.bid,
        user: row.user
      }));

      return res.status(200).json({ bids: bidsWithUser });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
);

auctionRouter.get("/seller/listings", verifyToken, async (req, res) => {
  try {
    if (req.userId === undefined || req.role !== "seller") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const { brand, page = "1", limit = "10", sort } = req.query;

    const conditions = [];

    if (brand && !/all/gi.test(brand as string))
      conditions.push(eq(vehicles.make, String(brand)));

    conditions.push(eq(vehicles.sellerId, req.userId as number));

    const pageNum = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * pageSize;

    const result = await db
      .select()
      .from(vehicles)
      .where(conditions.length ? and(...conditions) : undefined)
      .limit(pageSize + 1)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(conditions.length ? and(...conditions) : undefined);

    res.status(200).json({
      vehicles: result,
      totalCount: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: pageNum,
      hasNextPage: result.length > pageSize,
    });
  } catch (err: any) {
    console.error("Error fetching vehicles:", err);
    res
      .status(500)
      .json({ message: "Error fetching vehicle list", error: err.message });
  }
});

auctionRouter.post("/create", verifyToken, async (req, res) => {
  if (!req.userId || !req.card_verified) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  try {
    // const result = vehicleUploadSchema.safeParse(req.body);
    // if (result.error) {
    //   return res.status(401).json({ error: result.error });
    // }
    const { vehicleId, title, description, startDate, endDate, startingPrice } =
      req.body;

    if (
      !vehicleId ||
      !title.trim() ||
      !description.trim() ||
      !startDate ||
      !endDate ||
      !startingPrice ||
      isNaN(parseFloat(startingPrice))
    ) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const now = new Date();
    console.log("Current time:", now);
    console.log("Auction start date:", new Date(startDate));
    console.log("Auction start timestamp:", new Date(startDate).getTime());
    console.log("Current timestamp:", Date.now());
    
    if (new Date(startDate).getTime() <= Date.now()) {
      return res.status(400).json({ error: "invalid startDate" });
    }

    if(new Date(endDate).getTime()<= new Date(startDate).getTime()){
       return res.status(400).json({ error: "invalid endDate" });
    }

    const vehicleRows = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, vehicleId));
    const vehicle = vehicleRows[0];
    if (!vehicle) return res.status(400).json({ error: "Vehicle not found" });
    
    const newAuction = {
      vehicleId: parseInt(vehicleId),
      title,
      description,
      startingPrice: parseFloat(startingPrice),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: "UPCOMING" as typeof auctions.$inferInsert.status,
      sellerId: req.userId,
    };

    console.log("Creating new auction:", newAuction);

    const dbReturnData = await db
      .insert(auctions)
      .values(newAuction)
      .returning();
    const savedAuctionDetails = dbReturnData[0];
    console.log("Saved auction details:", savedAuctionDetails);
    
    const delay = Math.max(0, savedAuctionDetails.startDate.getTime() - Date.now());
    console.log(`Scheduling auction to start with delay of ${delay}ms`);
    
    // Add job with better logging
    try {
      const job = await auctionQueue.add(
        "startAuction",
        {
          auctionId: savedAuctionDetails.id,
          endTime: savedAuctionDetails.endDate,
        },
        {
          delay: delay,
          attempts: 3, 
          backoff: {
            type: 'exponential',
            delay: 1000
          },
          // removeOnComplete: false, 
          // removeOnFail: false 
        }
      );
      
      console.log(`Added job to queue with ID: ${job.id}`);
      console.log(`Job will process in approximately ${delay}ms`);
      console.log(`Job will process at: ${new Date(Date.now() + delay)}`);
    } catch (error) {
      console.error("Error scheduling auction job:", error);
      return res.status(500).json({ error: "Failed to schedule auction" });
    }

    return res.status(200).json({ 
      message: "Auction created successfully",
      auctionId: savedAuctionDetails.id,
      startTime: savedAuctionDetails.startDate,
      scheduledAt: new Date(Date.now() + delay)
    });
  } catch (e: any) {
    console.error("Error creating auction:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Export the router
export default auctionRouter;
