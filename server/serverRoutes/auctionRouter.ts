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
    console.log(req.query);
    const { brand, model, page = "1", limit = "10", type } = req.query;

    const conditions = [];

    if (brand && !/all/gi.test(brand as string))
      conditions.push(eq(vehicles.make, String(brand)));
    if (model && !/all/gi.test(model as string))
      conditions.push(eq(vehicles.model, String(model)));
    if (type && !/all/gi.test(type as string) && vehicleTypesEnum.enumValues.includes(String(type).toLocaleLowerCase() as any)) {
      conditions.push(eq(vehicles.type, String(type).toLocaleLowerCase() as (typeof vehicleTypesEnum.enumValues)[number]));
    }

    console.log(conditions);

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
      .where(conditions.length ? and(...conditions) : undefined);

    const auctionsWithVehicleDetails = result.map((row) => {
      const auction = row.auction as any; // Cast to any to access auction properties
      const vehicle = row.vehicle as Vehicle; // Cast to Vehicle type
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
    console.log(req.params.id);
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
    console.log(req.query);
    const { brand, page = "1", limit = "10", sort } = req.query;

    const conditions = [];

    if (brand && !/all/gi.test(brand as string))
      conditions.push(eq(vehicles.make, String(brand)));

    console.log(conditions);
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
  if (!req.userId || req.role !== "seller") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  try {
    // const result = vehicleUploadSchema.safeParse(req.body);
    // if (result.error) {
    //   return res.status(401).json({ error: result.error });
    // }
    console.log(req.body);
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
      return res.status(400).json({ error: "Inalid input" });
    }
    const vehicleRows = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, vehicleId));
    const vehicle = vehicleRows[0];
    if (!vehicle) return res.status(400).json({ error: "vehicle not found" });
    const newAuction = {
      vehicleId: parseInt(vehicleId),
      title,
      description,
      startingPrice: parseFloat(startingPrice),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: "upcoming",
    };

    const dbReturnData = await db
      .insert(auctions)
      .values(newAuction)
      .returning();
    const savedAuctionDetails = dbReturnData[0];
    await auctionQueue.add(
      "startAuction",
      {
        auctionId: savedAuctionDetails.id,
        endTime: savedAuctionDetails.endDate,
      },
      {
        delay: savedAuctionDetails.startDate.getTime() - Date.now(),
      }
    );

    console.log("added to the queue");
    return res.status(200).json({ message: "Auction created successfully" });
  } catch (e: any) {
    console.log(e.message);
    return res.status(500).json();
  }
});

// Export the router
export default auctionRouter;
