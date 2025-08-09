import { Router } from "express";
import { db } from "../db";
import {
  auctions,
  Vehicle,
  vehicles,
  bids,
  users,
  auctionDrafts,
  vehicleDrafts,
  numberPlate,
  paymentSession,
  auctionFavourites
} from "../../shared/schema";
import { eq, lte, or, gte, and, sql, inArray } from "drizzle-orm";
import RedisClientSingleton from "../utils/redis";
import axios from "axios";
import { vehicleUploadSchema } from "../../shared/zodSchema/vehicleSchema";
import { number, z } from "zod";
import { verifyToken } from "../middleware/authMiddleware";
import { parseCsvFile, extractVehicles } from "../utils/helper";
import multer from "multer";
import { auctionQueue, bidQueue } from "../worker/queue";
import { vehicleTypesEnum } from "../../shared/schema";
import { stripe } from "../utils/stripe";
import { CURRENCY } from "../utils/constants";
import { paymentQueue } from "../worker/queue";
// const redisClient = RedisClientSingleton.getInstance().getRedisClient();

const upload = multer();

const auctionRouter = Router();

auctionRouter.get("/get", async (req, res) => {
  try {
    const {
      brand,
      model,
      itemType,
      page = "1",
      limit = "10",
      type,
    } = req.query;

    const conditions = [eq(auctions.status, "RUNNING")];

    console.log(itemType);
    if (!itemType || !["VEHICLE", "NUMBERPLATE"].includes(String(itemType)))
      return res.status(400).json({ error: "itemType not specified" });

    conditions.push(eq(auctions.itemType, String(itemType).toUpperCase()));

    if (
      String(itemType).toUpperCase() === "VEHICLE" &&
      brand &&
      String(brand).toLowerCase() !== "all"
    )
      conditions.push(eq(vehicles.make, String(brand)));
    if (
      String(itemType).toUpperCase() === "VEHICLE" &&
      model &&
      String(brand).toLowerCase() !== "all"
    )
      conditions.push(eq(vehicles.model, String(model)));

    if (
      String(itemType).toUpperCase() === "VEHICLE" &&
      type &&
      vehicleTypesEnum.enumValues.includes(
        String(
          type
        ).toLocaleLowerCase() as (typeof vehicleTypesEnum.enumValues)[number]
      )
    ) {
      conditions.push(
        eq(
          vehicles.type,
          String(
            type
          ).toLocaleLowerCase() as (typeof vehicleTypesEnum.enumValues)[number]
        )
      );
    }
    const MAXLIMIT = 50;
    const pageNum = parseInt(page as string, 10);
    const pageSize =
      parseInt(limit as string, 10) <= MAXLIMIT
        ? parseInt(limit as string, 10)
        : MAXLIMIT;
    const offset = (pageNum - 1) * pageSize;

    let result: any;
    let auctionsWithItemDetails: any;

    if (itemType === "VEHICLE") {
      result = await db
        .select({
          auction: auctions,
          vehicle: vehicles,
        })
        .from(auctions)
        .innerJoin(vehicles, eq(auctions.itemId, vehicles.id))
        .where(conditions.length ? and(...conditions) : undefined)
        .limit(pageSize + 1)
        .offset(offset);

      auctionsWithItemDetails = result.map((row: any) => {
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
    } else if (itemType === "NUMBERPLATE") {
      result = await db
        .select({
          auction: auctions,
          numberPlate: numberPlate,
        })
        .from(auctions)
        .innerJoin(numberPlate, eq(auctions.itemId, numberPlate.id))
        .where(conditions.length ? and(...conditions) : undefined)
        .limit(pageSize + 1)
        .offset(offset);

      auctionsWithItemDetails = result.map((row: any) => {
        const auction = row.auction as any;
        const numberPlate = row.numberPlate as any;
        return {
          ...auction,
          remainingTime: new Date(auction.endDate).getTime() - Date.now(),
          numberPlate: {
            id: numberPlate.id,
            document_urls: numberPlate.document_url,
            plate_number: numberPlate.plate_number,
            plate_value: numberPlate.plate_value,
          },
        };
      });
    }

    let totalCount: number = 0;

    if (itemType === "VEHICLE") {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(auctions)
        .innerJoin(vehicles, eq(auctions.itemId, vehicles.id))
        .where(conditions.length ? and(...conditions) : undefined);
      totalCount = count;
    } else if (itemType === "NUMBERPLATE") {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(auctions)
        .innerJoin(numberPlate, eq(auctions.itemId, numberPlate.id))
        .where(conditions.length ? and(...conditions) : undefined);
      totalCount = count;
    }

    res.status(200).json({
      auctions: auctionsWithItemDetails,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
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
      .select()
      .from(auctions)
      .where(eq(auctions.id, auctionId));

    if (!result.length) {
      return res.status(404).json({ error: "Auction not found" });
    }

    const auction = result[0];

    if (auction.itemType === "VEHICLE") {
      const [vehicle] = await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.id, Number(auction.itemId)));
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
    } else if (auction.itemType === "NUMBERPLATE") {
      const [numberPlateDetail] = await db
        .select()
        .from(numberPlate)
        .where(eq(numberPlate.id, Number(auction.itemId)));
      const auctionWithNumberPlateDetails = {
        ...auction,
        remainingTime: new Date(auction.endDate).getTime() - Date.now(),
        numberPlate: {
          id: numberPlateDetail.id,
          document_url: numberPlateDetail.document_url,
          plate_value: numberPlateDetail.plate_value,
          plate_number: numberPlateDetail.plate_number,
        },
      };
      res.status(200).json(auctionWithNumberPlateDetails);
    }
  } catch (err: any) {
    console.error("Error fetching auction:", err);
    res
      .status(500)
      .json({ message: "Error fetching auction", error: err.message });
  }
});


auctionRouter.post("/update-favourite", verifyToken, async (req, res) => {
  try {
    if (!req.userId) return res.status(403).json({ error: "unauthorized" });
    let { auctionId, toAdd } = req.body;
    auctionId = parseInt(auctionId, 10);
    if (typeof auctionId !== "number" || isNaN(auctionId)) {
      return res.status(400).json({ error: "auction ID or toAdd is missing" });
    }
    await db.transaction(async (trx) => {
      const isFavourite = await trx.execute(
        sql`
      SELECT id 
      FROM ${auctionFavourites}
      WHERE ${auctionFavourites.auctionId} = ${auctionId}
      AND ${auctionFavourites.userId} = ${req.userId}
      FOR UPDATE
    `
      );

      if (isFavourite.rows.length === 0) {
        await trx.insert(auctionFavourites).values({
          auctionId: auctionId,
          userId: req.userId,
        });
      } else {
        await trx
          .delete(auctionFavourites)
          .where(
            and(
              eq(auctionFavourites.auctionId, auctionId),
              eq(auctionFavourites.userId, req.userId as number)
            )
          );
      }
    });

    res.status(201).json({ message: "success" });
  } catch (err: any) {
    console.error("Error updating vehicle favourite:", err);
    res.status(500).json({ message: "Error updating vehicle favourite" });
  }
});

auctionRouter.post("/bids/verify-payment", verifyToken, async (req, res) => {
  if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
  const { paymentIntentId } = req.body;

  if (!paymentIntentId) {
    return res.status(400).json({ error: "Missing paymentIntentId" });
  }

  try {
    const redis = await RedisClientSingleton.getRedisClient();
    const payment_session_redis = await redis.get(
      `paymentSession:${paymentIntentId}`
    );

    //check if the payment session exists in our system and if it belongs to the user
    if (payment_session_redis) {
      const parsedPaymentSession = JSON.parse(payment_session_redis);
      if (parsedPaymentSession.userId != req.userId) {
        //fraud attempt
        return res.status(401).json({
          error: "You are not authorized to validate this payment",
        });
      }
    } else {
      const [payment_session_db] = await db
        .select()
        .from(paymentSession)
        .where(eq(paymentSession.paymentIntentId, paymentIntentId));
      if(payment_session_db.status!=='PENDING')
        return res.status(400).json({ error: "Payment Expired or Already Processed" });
      if (payment_session_db.userId !== req.userId) {
        //fraud attempt
        return res.status(401).json({
          error: "You are not authorized to validate this payment",
        });
      }
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      const { auctionId, userId, bidAmount } = paymentIntent.metadata;
      await redis.del(`paymentSession:${paymentIntentId}`);
      await bidQueue.add("processBid", {
        userId: req.userId,
        paymentIntentId,
        auctionId,
        bidAmount,
      });
      return res.status(200).json({ success: true });
    } else {
      return res.status(400).json({ error: "Payment not successful yet" });
    }
  } catch (err) {
    console.error("Stripe verification error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

auctionRouter.post(
  "/place/live-bid/:auctionId",
  verifyToken,
  async (req, res) => {
    if (!req.userId) return res.status(403).json({ error: "Unauthorized" });
    try {
      const auctionId = parseInt(req.params.auctionId, 10);
      if (isNaN(auctionId)) {
        return res.status(400).json({ error: "Invalid auction ID" });
      }
      let { bidAmount } = req.body;
      bidAmount = parseFloat(bidAmount);
      if (!bidAmount || isNaN(bidAmount) || bidAmount < 0) {
        return res.status(400).json({ error: "invalid bidAmount" });
      }

      const BID_REQUEST_CHARGE_AMOUNT = 2; //2 pounds
      const amountInPence = Math.round(BID_REQUEST_CHARGE_AMOUNT * 100);
      //create payment session
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInPence,
        currency: CURRENCY,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          auctionId: auctionId.toString(),
          userId: req.userId.toString(),
          bidAmount: bidAmount,
        },
      });
      const [payment_session] = await db
        .insert(paymentSession)
        .values({
          userId: req.userId,
          amount: amountInPence,
          currency: CURRENCY,
          status: "PENDING",
          paymentIntentId: paymentIntent.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        })
        .returning();
      const redis = await RedisClientSingleton.getRedisClient();
      await redis.set(
        `paymentSession:${paymentIntent.id}`,
        JSON.stringify({
          userId: req.userId,
          status: "PENDING",
          auctionId: auctionId,
          bidAmount: bidAmount,
          chargedAmount: BID_REQUEST_CHARGE_AMOUNT,
        }),
        { EX: 60 * 2 } // expires in 2 minutes
      );

      return res.status(202).json({
        message: "success",
        clientSecret: paymentIntent.client_secret,
        timeout: "2 minutes",
        chargedAmount: BID_REQUEST_CHARGE_AMOUNT,
        currency: CURRENCY,
      });
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

auctionRouter.get("/bids/:auctionId", async (req, res) => {
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
        },
      })
      .from(bids)
      .innerJoin(users, eq(bids.userId, users.id))
      .where(eq(bids.auctionId, auctionId))
      .orderBy(sql`${bids.createdAt} DESC`);

    const bidsWithUser = result.map((row) => ({
      ...row.bid,
      user: row.user,
    }));

    return res.status(200).json({ bids: bidsWithUser });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

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

auctionRouter.patch("/update-draft/:draftId", verifyToken, async (req, res) => {
  if (!req.userId) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  try {
    // const result = vehicleUploadSchema.safeParse(req.body);
    // if (result.error) {
    //   return res.status(401).json({ error: result.error });
    // }
    const auctionDraftId = req.params.draftId;
    const { itemId, itemType } = req.body;

    if (
      !auctionDraftId ||
      isNaN(parseInt(auctionDraftId)) ||
      !itemId ||
      isNaN(parseInt(itemId)) ||
      !itemType
    ) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const [draft] = await db
      .select()
      .from(auctionDrafts)
      .where(eq(auctionDrafts.id, parseInt(auctionDraftId)));
    if (!draft || draft.sellerId != req.userId)
      return res.status(404).json({ error: "not found" });

    let fetchedItem: any;
    if (itemType === "VEHICLE") {
      const [row] = await db
        .select()
        .from(vehicleDrafts)
        .where(eq(vehicleDrafts.id, parseInt(itemId)));
      fetchedItem = row;
    } else if (itemType === "NUMBERPLATE") {
      const [row] = await db
        .select()
        .from(numberPlate)
        .where(eq(numberPlate.id, parseInt(itemId)));
      fetchedItem = row;
    }
    if (!fetchedItem)
      return res.status(404).json({ error: "draft Item not found" });
    await db.update(auctionDrafts).set({ itemId: fetchedItem.id });

    console.log("Auction Draft updated");

    return res.status(200).json({
      message: "Auction updated successfully",
    });
  } catch (e: any) {
    console.error("Error creating auction:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

auctionRouter.post("/numberplate/create", verifyToken, async (req, res) => {
  if (!req.userId) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  try {
    const { plate_number, document_url, plate_value } = req.body;
    console.log(req.body);
    if (!plate_number || !plate_number.trim() || !document_url || !plate_value) {
      return res.status(400).json({ error: "Invalid input" });
    }

    //add logic for getting plate value
    //DEPRECATED -> NOW GETTING THE PLATE_VALUE FROM THE USER
    // const plateValue = 1000; //in pounds

    const newNumberPlate = {
      plate_number: plate_number,
      document_url: document_url,
      sellerId: req.userId,
      plate_value: plate_value,
    };

    const dbReturnData = await db
      .insert(numberPlate)
      .values(newNumberPlate)
      .returning();

    const savedNumberPlateDetails = dbReturnData[0];

    return res.status(200).json({
      message: "NumberPlate created successfully",
      draftId: savedNumberPlateDetails.id,
      plate_value,
    });
  } catch (e: any) {
    console.error("Error creating auction:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

auctionRouter.post("/create", verifyToken, async (req, res) => {
  if (!req.userId) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  try {
    // const result = vehicleUploadSchema.safeParse(req.body);
    // if (result.error) {
    //   return res.status(401).json({ error: result.error });
    // }
    const { itemType, title, description, durationDays } =
      req.body;
    console.log(req.body);
    if (
      !itemType ||
      !title.trim() ||
      !description.trim() ||
      !durationDays ||
      !["3", "5", "7"].includes(durationDays)
    ) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const durationDaysNum = parseInt(durationDays);
    // Calculate start and end dates
    const now = new Date();
    const startDate = new Date(now.getTime() + 60 * 1000); // Start 1 min from now
    const endDate = new Date(
      startDate.getTime() + durationDaysNum * 24 * 60 * 60 * 1000
    );

    console.log("Current time:", now);
    console.log("Auction start date:", startDate);
    console.log("Auction end date:", endDate);

    // const vehicleRows = await db
    //   .select()
    //   .from(vehicles)
    //   .where(eq(vehicles.id, vehicleId));
    // const vehicle = vehicleRows[0];
    // if (!vehicle) return res.status(400).json({ error: "Vehicle not found" });

    const newAuction = {
      itemType: itemType,
      title,
      description,
      startingPrice: 0,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: "UPCOMING" as typeof auctions.$inferInsert.status,
      sellerId: req.userId,
    };

    console.log("Creating new auction:", newAuction);

    const dbReturnData = await db
      .insert(auctionDrafts)
      .values(newAuction)
      .returning();
    const savedAuctionDetails = dbReturnData[0];
    console.log("Saved auction details:", savedAuctionDetails);

    const delay = Math.max(
      0,
      savedAuctionDetails.startDate.getTime() - Date.now()
    );
    console.log(`Scheduling auction to start with delay of ${delay}ms`);

    // Add job with better logging
    // try {
    //   const job = await auctionQueue.add(
    //     "startAuction",
    //     {
    //       auctionId: savedAuctionDetails.id,
    //       endTime: savedAuctionDetails.endDate,
    //     },
    //     {
    //       delay: delay,
    //       attempts: 3,
    //       backoff: {
    //         type: "exponential",
    //         delay: 1000,
    //       },
    //       // removeOnComplete: false,
    //       // removeOnFail: false
    //     }
    //   );

    //   console.log(`Added job to queue with ID: ${job.id}`);
    //   console.log(`Job will process in approximately ${delay}ms`);
    //   console.log(`Job will process at: ${new Date(Date.now() + delay)}`);
    // } catch (error) {
    //   console.error("Error scheduling auction job:", error);
    //   return res.status(500).json({ error: "Failed to schedule auction" });
    // }

    return res.status(200).json({
      message: "Auction created successfully",
      draftId: savedAuctionDetails.id,
      itemType: savedAuctionDetails.itemType,
      startTime: savedAuctionDetails.startDate,
      scheduledAt: new Date(Date.now() + delay),
    });
  } catch (e: any) {
    console.error("Error creating auction:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Export the router
export default auctionRouter;
