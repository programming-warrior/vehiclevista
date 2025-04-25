import { Worker } from "bullmq";
import { connection } from "../workerRedis";
// import { WebSocketServer } from './websocket'; // assume you have a pub function
import { db } from "../../db";
import { auctions } from "../../../shared/schema";
import { eq } from "drizzle-orm";
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
      if (auction.status === "active" || auction.status === "ended") {
        console.log(`Auction ${auctionId} is already ${auction.status}`);
        return;
      }
      await db
        .update(auctions)
        .set({ status: "active" })
        .where(eq(auctions.id, auctionId));

      startCountdown(auctionId, endTime);
    } else if (job.name === "endAuction") {
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
      if (auction.status === "ended") {
        console.log(`Auction ${auctionId} is already ${auction.status}`);
        return;
      }
      await db
        .update(auctions)
        .set({ status: "ended" })
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
    connection.publish(
      `AUCTION_TIMER:${auctionId}`,
      JSON.stringify({
        auctionId,
        remainingTime,
      })
    );

    if (remainingTime <= 0) {
      clearInterval(interval);

      auctionCountdownIntervals.delete(auctionId);
      //   WebSocketServer.broadcastToAuction(auctionId, {
      //     type: 'auctionEnded',
      //     auctionId,
      //   });

      // Optionally schedule next job to declare winner, etc.
      await auctionQueue.add("endAuction", {
        auctionId: auctionId,
      });
    }
  }, 1000);

  auctionCountdownIntervals.set(auctionId, interval);
}

async function initActiveAuctionsCountdowns() {
  const activeAuctions = await db
    .select()
    .from(auctions)
    .where(eq(auctions.status, "active"));

  activeAuctions.forEach((auction) => {
    const remainingTime = new Date(auction.endDate).getTime() - Date.now();
    if (remainingTime > 0) {
      startCountdown(auction.id.toString(), auction.endDate.toISOString());
    } else {
      db.update(auctions)
        .set({ status: "ended" })
        .where(eq(auctions.id, auction.id));
    }
  });

  auctionWorker.on("ready", () => {
    console.log("Auction Worker is ready and connected to Redis");
  });
}

initActiveAuctionsCountdowns().catch((error) => {
  console.error("Error initializing active auctions countdowns:", error);
});
