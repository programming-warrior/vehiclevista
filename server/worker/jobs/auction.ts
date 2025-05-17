import { Worker } from "bullmq";
import { connection } from "../workerRedis";
// import { WebSocketServer } from './websocket'; // assume you have a pub function
import { db } from "../../db";
import { auctions, auctionWinner, bids, users } from "../../../shared/schema";
import { eq, sql } from "drizzle-orm";
import { auctionQueue } from "../queue";

const auctionWorker = new Worker(
  "auction",
  async (job) => {
    console.log(job);
    if (job.name === "startAuction") {
      const { auctionId, endTime } = job.data;
      const auctionRows = await db
        .select()
        .from(auctions)
        .where(eq(auctions.id, auctionId));
      const auction = auctionRows[0];
      console.log(auction);
      if (!auction) {
        console.error(`Auction with ID ${auctionId} not found`);
        return;
      }
      if (auction.status === "RUNNING" || auction.status === "ENDED") {
        console.log(`Auction ${auctionId} is already ${auction.status}`);
        return;
      }
      await db
        .update(auctions)
        .set({ status: "RUNNING" })
        .where(eq(auctions.id, auctionId));

      startCountdown(auctionId, endTime);
    } else if (job.name === "endAuction") {
      console.log("end auction job started");
      const { auctionId } = job.data;
      const auctionRows = await db
        .select()
        .from(auctions)
        .where(eq(auctions.id, auctionId));
      const auction = auctionRows[0];
      console.log(auction);
      if (!auction) {
        console.error(`Auction with ID ${auctionId} not found`);
        return;
      }
      if (auction.status === "ENDED") {
        console.log(`Auction ${auctionId} is already ${auction.status}`);
        return;
      }
      const [highestBid] = await db
        .select({
          bids,
          users
        })
        .from(bids)
        .innerJoin(users, eq(bids.userId, users.id))
        .where(eq(bids.auctionId, auctionId))
        .orderBy(sql`${bids.bidAmount} DESC`)
        .limit(1);
      
      let winnerId = null;
      if (highestBid && highestBid.bids.id) {
        winnerId = highestBid.bids.userId;
        await db.insert(auctionWinner).values({
          auctionId: auctionId,
          userId: winnerId,
          bidId: highestBid.bids.id,
          bidAmount: highestBid.bids.bidAmount,
          userEmail: highestBid.users.email,
          username: highestBid.users.username,
          createdAt: new Date()
        });
      }
      
      await db
        .update(auctions)
        .set({ status: "ENDED" })
        .where(eq(auctions.id, auctionId));
    }
  },
  { connection }
);

const auctionCountdownIntervals = new Map<string, NodeJS.Timeout>();

function startCountdown(auctionId: string, endTime: string) {
  const interval = setInterval(async () => {
    const now = new Date();
    const remainingTime = new Date(endTime).getTime() - now.getTime();

    console.log(remainingTime);
    // WebSocketServer.broadcastToAuction(auctionId, {
    //   type: 'countdown',
    //   auctionId,
    //   remaining,
    // });
    console.log("timer published to redis");

    if (remainingTime <= 0) {
      clearInterval(interval);

      auctionCountdownIntervals.delete(auctionId);

      // Optionally schedule next job to declare winner, etc.
      await auctionQueue.add("endAuction", {
        auctionId: auctionId,
      });
    } else {
      connection.publish(
        `AUCTION_TIMER:${auctionId}`,
        JSON.stringify({
          auctionId,
          remainingTime,
        })
      );
    }
  }, 1000);

  auctionCountdownIntervals.set(auctionId, interval);
}

async function initActiveAuctionsCountdowns() {
  const activeAuctions = await db
    .select()
    .from(auctions)
    .where(eq(auctions.status, "RUNNING"));

  activeAuctions.forEach((auction) => {
    const remainingTime = new Date(auction.endDate).getTime() - Date.now();
    // if (remainingTime > 0) {
    startCountdown(auction.id.toString(), auction.endDate.toISOString());
    // } else {
    //   db.update(auctions)
    //     .set({ status: "ENDED" })
    //     .where(eq(auctions.id, auction.id));
    // }
  });

  auctionWorker.on("ready", () => {
    console.log("Auction Worker is ready and connected to Redis");
  });
}

initActiveAuctionsCountdowns().catch((error) => {
  console.error("Error initializing active auctions countdowns:", error);
});
