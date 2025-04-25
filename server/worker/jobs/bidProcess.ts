import { Worker } from "bullmq";
import { connection } from "../workerRedis";
// import { WebSocketServer } from './websocket'; // assume you have a pub function
import { db } from "../../db";
import { auctions, bids } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { json } from "stream/consumers";

const bidWorker = new Worker(
  "bid",
  async (job) => {
    if (job.name === "processBid") {
      const { auctionId, userId, bidAmount } = job.data;
      let insertedBids: any;
      console.log("received bid request");
      await db.transaction(async (trx) => {
        const result = await trx
          .select({
            auction: auctions,
          })
          .from(auctions)
          .where(eq(auctions.id, auctionId));

        const row = result[0] ?? null;
        if (!row) throw new Error("auction not found");

        const now = new Date();

        if (now < row.auction.startDate || now > row.auction.endDate) {
          throw new Error("Auction not active");
        }

        if ((row.auction.currentBid ?? 0) >= bidAmount) {
          throw new Error(
            JSON.stringify("Bid amount needs to be greater than the currentBid")
          );
        }
        insertedBids = await trx
          .insert(bids)
          .values({
            auctionId: auctionId,
            userId: Number(userId),
            bidAmount: bidAmount,
            createdAt: new Date(),
          })
          .returning();

        await trx
          .update(auctions)
          .set({
            currentBid: bidAmount,
            totalBids: (row.auction.totalBids ?? 0) + 1,
          })
          .where(eq(auctions.id, auctionId));
      });
      console.log("bid added to the db and auction upadted");
      const bidId = insertedBids[0]?.id;
      await connection.publish(
        `BID_PLACED`,
        JSON.stringify({
          auctionId,
          userId,
          bidAmount,
          bidId,
        })
      );
      console.log("bid published to redis");
    }
  },
  { connection }
);

bidWorker.on("ready", () => {
  console.log("Bid Worker is ready and connected to Redis");
});

bidWorker.on("failed", (job, err: any) => {
  console.log("bid failed");
  console.log(job);

  connection.publish(
    `BID_PLACED_ERROR`,
    JSON.stringify({
      error: err.message,
      payload: {
        auctionId: job?.data.auctionId,
        userId: job?.data.userId, 
        bidAmount: job?.data.bidAmount
      },
    })
  );
  console.log(err);
});
