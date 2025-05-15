import { Worker } from "bullmq";
import { connection } from "../workerRedis";
// import { WebSocketServer } from './websocket'; // assume you have a pub function
import { db } from "../../db";
import { auctions, bids, raffle, raffleTicketSale } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { json } from "stream/consumers";

const bidWorker = new Worker(
  "bid",
  async (job) => {
    console.log(job.name);
    console.log(job.data)
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
    else if (job.name=='processRaffleTicket'){
      const { raffleId, userId, ticketQuantity } = job.data;
      let insertedBids: any;
      console.log("received raffle ticket request");
      await db.transaction(async (trx) => {
        const result = await trx
          .select()
          .from(raffle)
          .where(eq(raffle.id, raffleId));

        const row = result[0] ?? null;
        if (!row) throw new Error("raffle not found");

        const now = new Date();

        if (row.status!=='running' || now < row.startDate || now > row.endDate) {
          throw new Error("Raffle not running");
        }

        if ((row.ticketQuantity - row.soldTicket) < ticketQuantity) {
          throw new Error(
            JSON.stringify("Ticket quantity exceeds issued remaining tickets")
          );
        }

        insertedBids = await trx
          .insert(raffleTicketSale)
          .values({
            raffleId: raffleId,
            userId: Number(userId),
            ticketQtn: Number(ticketQuantity),
            createdAt: new Date(),
          })
          .returning();

        await trx
          .update(raffle)
          .set({
            soldTicket: row.soldTicket + ticketQuantity
          })
          .where(eq(raffle.id, raffleId));
      });
      console.log("bid added to the db and auction upadted");
      const bidId = insertedBids[0]?.id;
      await connection.publish(
        `RAFFLE_TICKET_PURCHASED`,
        JSON.stringify({
          raffleId,
          userId,
          ticketQuantity,
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

bidWorker.on('error',(e)=>{
  console.log(e);
})

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
        bidAmount: job?.data.bidAmount, 
        raffleId: job?.data.raffleId,
        ticketQuantity: job?.data.ticketQuantity
      },
    })
  );
  console.log(err);
});
