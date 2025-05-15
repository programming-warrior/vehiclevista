import { Router } from "express";
import { db } from "../db";
import { auctions, Vehicle, vehicles, bids,users, raffle } from "../../shared/schema";
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
import { error } from "console";

// const redisClient = RedisClientSingleton.getInstance().getRedisClient();

const upload = multer();

const raffleRouter = Router();

raffleRouter.get("/get", async (req, res) => {
  try {

    const [result] = await db
      .select()
      .from(raffle)
      .where(eq(raffle.status, "running"))
      .limit(1)

    res.status(200).json(result);
  } catch (err: any) {
    console.error("Error fetching vehicles:", err);
    res
      .status(500)
      .json({ message: "Error fetching vehicle list", error: err.message });
  }
});


raffleRouter.post(
  "/purchase-ticket/:raffleId",
  verifyToken,
  async (req, res) => {
    if (!req.userId || !req.card_verified) return res.status(403).json({ error: "Unauthorized" });
    try {
      const raffleId = parseInt(req.params.raffleId, 10);
      if (isNaN(raffleId)) {
        return res.status(400).json({ error: "Invalid raffle ID" });
      }
      let { ticketQuantity } = req.body;
      ticketQuantity = parseInt(ticketQuantity);
      if (!ticketQuantity || isNaN(ticketQuantity) || ticketQuantity< 0) {
        return res.status(400).json({ error: "invalid ticket quantity" });
      }

      const result = await db.select().from(raffle);

      if(result.length == 0) return res.status(404).json({error:"Invalid RaffleID"})
    
      if(result[0].status!=='running') return res.status(404).json({error:"raffle is not running"})

        
    //    await bidQueue.add('processBid', { auctionId, userId: req.userId, bidAmount })
      await bidQueue.add('processRaffleTicket', { raffleId, userId: req.userId, ticketQuantity })
        console.log('added to the bid queue')
      return res.status(202).json({ message: "Purchase queued" });
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
  }
);

raffleRouter.get(
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


raffleRouter.post('/increase-views', async (req, res) => {
  try {
    const { raffleId } = req.body;
    if (!raffleId) {
      return res.status(400).json({ error: "Vehicle ID is required" });
    }
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];
  
    console.log("IP:", ip);
    console.log("User Agent:", userAgent);
    if(!ip || !userAgent) {
      return res.status(400).json({ error: "IP or User Agent is missing" });
    }
    const redisClient = await RedisClientSingleton.getRedisClient()
    const alreadyViewed= await redisClient.get(`raffle:${raffleId}:views:${ip}`);
    if(alreadyViewed){
      return res.status(200).json({ message: "Already viewed recently" });
    }
    await Promise.all([
      redisClient.incr(`raffle:${raffleId}:views`),
      redisClient.set(`raffle:${raffleId}:views:${ip}`, "1", "EX", 1 * 60) 
    ]);
    res.status(201).json({ message: "success" });
  }
  catch (err: any) {
    console.error("Error updating views count:", err);
    res
      .status(500)
      .json({ message: "Error updating views count" });
  }
});


raffleRouter.post('/increase-clicks', async (req, res) => {
  try {
    const { raffleId } = req.body;
    if (!raffleId) {
      return res.status(400).json({ error: "Vehicle ID is required" });
    }
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];
  
    console.log("IP:", ip);
    console.log("User Agent:", userAgent);
    if(!ip || !userAgent) {
      return res.status(400).json({ error: "IP or User Agent is missing" });
    }
    const redisClient = await RedisClientSingleton.getRedisClient()
    const alreadyClicked = await redisClient.get(`raffleId:${raffleId}:clicks:${ip}`);
    if(alreadyClicked){
      return res.status(200).json({ message: "Already clicked recently" });
    }
    await Promise.all([
      redisClient.incr(`vehicle:${raffleId}:clicks`),
      redisClient.set(`vehicle:${raffleId}:clicks:${ip}`, "1", "EX", 1 * 60) 
    ]);
    res.status(201).json({ message: "success" });
  }
  catch (err: any) {
    console.error("Error updating clicks count:", err);
    res
      .status(500)
      .json({ message: "Error updating clicks count" });
  }
});


// Export the router
export default raffleRouter;
