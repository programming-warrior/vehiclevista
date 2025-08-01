import { Router } from "express";
import { db } from "../db";
import {
  auctions,
  Vehicle,
  vehicles,
  bids,
  users,
  raffle,
  raffleTicketSale,
  paymentSession,
} from "../../shared/schema";
import { eq, lte, or, gte, and, sql, inArray } from "drizzle-orm";
import RedisClientSingleton from "../utils/redis";
import axios from "axios";
import { vehicleUploadSchema } from "../../shared/zodSchema/vehicleSchema";
import { z } from "zod";
import { verifyToken } from "../middleware/authMiddleware";
import { parseCsvFile, extractVehicles } from "../utils/helper";
import multer from "multer";
import { auctionQueue, bidQueue, raffleQueue } from "../worker/queue";
import { vehicleTypesEnum } from "../../shared/schema";
import { stripe } from "../utils/stripe";
import { CURRENCY } from "../utils/constants";
import { Repeat1 } from "lucide-react";

// const redisClient = RedisClientSingleton.getInstance().getRedisClient();

const upload = multer();

const raffleRouter = Router();

raffleRouter.get("/get", async (req, res) => {
  try {
    const [result] = await db
      .select()
      .from(raffle)
      .where(eq(raffle.status, "RUNNING"))
      .limit(1);

    res.status(200).json(result);
  } catch (err: any) {
    console.error("Error fetching vehicles:", err);
    res
      .status(500)
      .json({ message: "Error fetching vehicle list", error: err.message });
  }
});

raffleRouter.get("/get/:id", verifyToken, async (req, res) => {
  if (!req.role || req.role !== "admin")
    res.status(401).json({
      error: "unauthorized",
    });
  try {
    const id = req.params.id;
    if (!id || isNaN(parseInt(id)))
      res.status(400).json({
        error: "invalid id",
      });
    const [result] = await db
      .select()
      .from(raffle)
      .where(eq(raffle.id, Number(id)));

    if (!result)
      return res.status(404).json({
        error: "not found",
      });
    res.status(200).json(result);
  } catch (err: any) {
    console.error("Error fetching vehicles:", err);
    res
      .status(500)
      .json({ message: "Error fetching vehicle list", error: err.message });
  }
});

raffleRouter.post("/purchase-ticket", verifyToken, async (req, res) => {
  if (!req.userId) return res.status(403).json({ error: "Unauthorized" });
  try {
    // const raffleId = parseInt(req.params.raffleId, 10);
    // if (isNaN(raffleId)) {
    //   return res.status(400).json({ error: "Invalid raffle ID" });
    // }
    let { ticketQuantity } = req.body;
    ticketQuantity = parseInt(ticketQuantity);
    if (!ticketQuantity || isNaN(ticketQuantity) || ticketQuantity < 0) {
      return res.status(400).json({ error: "invalid ticket quantity" });
    }

    //ONLY ONE RAFFLE WOULD BE RUNNING AT A TIME, SO DON'T NEED RAFFLEID
    const result = await db
      .select()
      .from(raffle)
      .where(eq(raffle.status, "RUNNING"));
    console.log(result);
    if (result.length == 0)
      return res.status(404).json({ error: "Invalid RaffleID" });

    console.log(result[0].status);

    const RAFFLE_TICKET_CHARGE_PERCENTAGE = 0.3; //thirty percent of the raffled vehicle value

    let totalChargedAmount =
      RAFFLE_TICKET_CHARGE_PERCENTAGE * ticketQuantity * result[0].ticketPrice;
    totalChargedAmount = Math.ceil(totalChargedAmount);
    // Ensure minimum charge is 2
    totalChargedAmount = Math.max(2, totalChargedAmount);

    const amountInPence = Math.round(totalChargedAmount * 100);
    //create payment session
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPence,
      currency: CURRENCY,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        raffleId: result[0].id.toString(),
        ticketQuantity: ticketQuantity,
        userId: req.userId.toString(),
        chargedAmount: totalChargedAmount,
      },
    });
    const redis = await RedisClientSingleton.getRedisClient();
    await redis.set(
      `paymentSession:${paymentIntent.id}`,
      JSON.stringify({
        raffleId: result[0].id.toString(),
        ticketQuantity: ticketQuantity,
        userId: req.userId.toString(),
        chargedAmount: totalChargedAmount,
        status: "PENDING",
      }),
      { EX: 60 * 2 } // 2 minutes
    );

    await db.insert(paymentSession).values({
      userId: req.userId,
      amount: totalChargedAmount,
      currency: CURRENCY,
      status: "PENDING",
      paymentIntentId: paymentIntent.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    });

    return res.status(202).json({
      message: "success",
      clientSecret: paymentIntent.client_secret,
      timeout: "2 mintues",
      chargedAmount: totalChargedAmount,
      currency: CURRENCY,
    });
    // await bidQueue.add("processRaffleTicket", {
    //   raffleId,
    //   userId: req.userId,
    //   ticketQuantity,
    // });
    // console.log("added to the bid queue");
  } catch (e: any) {
    if (e.message === "raffle not found") {
      return res.status(404).json({ error: e.message });
    }
    if (e.message === "bidAmount needs to be greater than the currentBid") {
      return res.status(400).json({ error: e.message });
    }
    console.log(e);
    return res.status(500).json({ error: e.message });
  }
});

raffleRouter.post("/purchase/verify-payment", verifyToken, async (req, res) => {
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
      if (payment_session_db.status !== "PENDING")
        return res
          .status(400)
          .json({ error: "Payment Expired or Already Processed" });
      if (payment_session_db.userId !== req.userId) {
        //fraud attempt
        return res.status(401).json({
          error: "You are not authorized to validate this payment",
        });
      }
    }
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      const { raffleId, userId, ticketQuantity, chargedAmount } =
        paymentIntent.metadata;
      await redis.del(`paymentSession:${paymentIntentId}`);
      await bidQueue.add("processRaffleTicket", {
        userId: req.userId,
        paymentIntentId,
        raffleId,
        ticketQuantity,
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

raffleRouter.get("/purchases", async (req, res) => {
  try {
    const [runningRaffle] = await db
      .select()
      .from(raffle)
      .where(eq(raffle.status, "RUNNING"));
    if (!runningRaffle)
      return res.status(404).json({
        error: "no running raffle",
      });
    const result = await db
      .select({
        ticketPurchases: raffleTicketSale,
        user: {
          id: users.id,
          username: users.username,
        },
      })
      .from(raffleTicketSale)
      .innerJoin(users, eq(raffleTicketSale.userId, users.id))
      .where(eq(raffleTicketSale.raffleId, runningRaffle.id))
      .orderBy(sql`${raffleTicketSale.createdAt} DESC`);

    const ticketPurchasesWithUser = result.map((row) => ({
      ...row.ticketPurchases,
      user: row.user,
    }));

    return res.status(200).json({ purchaseHistory: ticketPurchasesWithUser });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

raffleRouter.get("/purchases/:raffleId", verifyToken, async (req, res) => {
  if (!req.role || req.role !== "admin")
    res.status(401).json({
      error: "not authorized",
    });
  try {
    const raffleId = parseInt(req.params.raffleId, 10);
    if (isNaN(raffleId)) {
      return res.status(400).json({ error: "Invalid auction ID" });
    }

    const result = await db
      .select({
        ticketPurchases: raffleTicketSale,
        user: {
          id: users.id,
          username: users.username,
        },
      })
      .from(raffleTicketSale)
      .innerJoin(users, eq(raffleTicketSale.userId, users.id))
      .where(eq(raffleTicketSale.raffleId, raffleId))
      .orderBy(sql`${raffleTicketSale.createdAt} DESC`);

    const ticketPurchasesWithUser = result.map((row) => ({
      ...row.ticketPurchases,
      user: row.user,
    }));

    return res.status(200).json({ purchaseHistory: ticketPurchasesWithUser });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

raffleRouter.post("/increase-views", async (req, res) => {
  try {
    const { raffleId } = req.body;
    if (!raffleId) {
      return res.status(400).json({ error: "Vehicle ID is required" });
    }
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    console.log("IP:", ip);
    console.log("User Agent:", userAgent);
    if (!ip || !userAgent) {
      return res.status(400).json({ error: "IP or User Agent is missing" });
    }
    const redisClient = await RedisClientSingleton.getRedisClient();
    const alreadyViewed = await redisClient.get(
      `raffle:${raffleId}:views:${ip}`
    );
    if (alreadyViewed) {
      return res.status(200).json({ message: "Already viewed recently" });
    }
    await Promise.all([
      redisClient.incr(`raffle:${raffleId}:views`),
      redisClient.set(`raffle:${raffleId}:views:${ip}`, "1", "EX", 1 * 60),
    ]);
    res.status(201).json({ message: "success" });
  } catch (err: any) {
    console.error("Error updating views count:", err);
    res.status(500).json({ message: "Error updating views count" });
  }
});

raffleRouter.post("/increase-clicks", async (req, res) => {
  try {
    const { raffleId } = req.body;
    if (!raffleId) {
      return res.status(400).json({ error: "Vehicle ID is required" });
    }
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    console.log("IP:", ip);
    console.log("User Agent:", userAgent);
    if (!ip || !userAgent) {
      return res.status(400).json({ error: "IP or User Agent is missing" });
    }
    const redisClient = await RedisClientSingleton.getRedisClient();
    const alreadyClicked = await redisClient.get(
      `raffleId:${raffleId}:clicks:${ip}`
    );
    if (alreadyClicked) {
      return res.status(200).json({ message: "Already clicked recently" });
    }
    await Promise.all([
      redisClient.incr(`vehicle:${raffleId}:clicks`),
      redisClient.set(`vehicle:${raffleId}:clicks:${ip}`, "1", "EX", 1 * 60),
    ]);
    res.status(201).json({ message: "success" });
  } catch (err: any) {
    console.error("Error updating clicks count:", err);
    res.status(500).json({ message: "Error updating clicks count" });
  }
});

// Export the router
export default raffleRouter;
