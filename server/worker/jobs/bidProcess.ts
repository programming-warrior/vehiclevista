import { Worker } from "bullmq";
import { connection } from "../workerRedis";
import { db } from "../../db";
import {
  auctions,
  bids,
  raffle,
  raffleTicketSale,
  paymentSession,
  users,
  Raffle,
  Auction,
} from "../../../shared/schema";
import { eq, sql } from "drizzle-orm";
import { createRefund } from "../../utils/stripe";
import { notificationQueue } from "../queue";

const bidWorker = new Worker(
  "bid",
  async (job) => {
    console.log(job.name);
    console.log(job.data);
    if (job.name === "processBid") {
      const { auctionId, userId, bidAmount, paymentIntentId } = job.data;
      let insertedBids: any;
      try {
        console.log("processing bid for amount " + bidAmount);
        await db.transaction(async (trx) => {
          const result = await trx.execute(sql`
              SELECT * FROM ${auctions} WHERE ${auctions.id} = ${auctionId} FOR UPDATE
          `);
          console.log(result);
          const row: any = (result?.rows[0] as Auction) ?? null;
          if (!row) throw new Error("auction not found");

          console.log("Auction found");
          if ((row.current_bid ?? 0) >= bidAmount) {
            throw new Error(
              JSON.stringify(
                "Bid amount needs to be greater than the currentBid"
              )
            );
          }
          insertedBids = await trx
            .insert(bids)
            .values({
              auctionId: auctionId,
              userId: Number(userId),
              bidAmount: bidAmount,
            })
            .returning();

          await trx
            .update(paymentSession)
            .set({
              status: "COMPLETED",
              updatedAt: new Date(),
            })
            .where(eq(paymentSession.paymentIntentId, paymentIntentId));

          await trx
            .update(auctions)
            .set({
              currentBid: bidAmount,
              totalBids: (row.total_bids ?? 0) + 1,
            })
            .where(eq(auctions.id, auctionId));
        });
        console.log("bid added to the db and auction upadted");

        const bidId = insertedBids[0]?.id;
        //publish a bid created event to the redis for websocket server
        await connection.publish(
          `BID_PLACED`,
          JSON.stringify({
            auctionId: auctionId,
            bidAmount: bidAmount,
            userId: Number(userId),
            bidId:insertedBids[0]?.id,
            createdAt: insertedBids[0]?.createdAt,
          })
        );
        await notificationQueue.add("auctionBid-placed-success", {
          userId,
          auctionId,
          bidAmount,
          bidId,
        });

      } catch (e) {
        const refund = await createRefund(
          paymentIntentId,
          "requested_by_customer"
        );
        console.log(refund);
        await db
          .update(paymentSession)
          .set({
            status: "FAILED",
            updatedAt: new Date(),
          })
          .where(eq(paymentSession.paymentIntentId, paymentIntentId));

        await notificationQueue.add("auctionBid-placed-failed", {
          userId,
          auctionId,
          bidAmount,
          refund,
        });
        console.log(e);
      }
    } else if (job.name == "processRaffleTicket") {
      let { raffleId, userId, ticketQuantity, paymentIntentId } = job.data;
      if(!Number.isInteger(raffleId) || !Number.isInteger(userId) || !Number.isInteger(ticketQuantity)){
        throw new Error("Invalid raffleId or userId or ticket quantity. Only Integer is Expected");
      }
      let insertedBids: any;
     
      try {
        if (!paymentIntentId) throw new Error("paymentIntentId invalid");
        await db.transaction(async (trx) => {
          const result = await trx.execute(sql`
              SELECT * FROM ${raffle} WHERE ${raffle.id} = ${raffleId} FOR UPDATE
          `);
  
          const row:any = (result?.rows[0] as Raffle) ?? null;
          console.log(row);
          if (!row) throw new Error("raffle not found");

          const now = new Date();

          if (
            row.status !== "RUNNING" ||
            now < row.start_date ||
            now > row.end_date
          ) {
            throw new Error("Raffle not running");
          }
          console.log(row.ticket_quantity + " " + row.sold_ticket);
          if (row.ticket_quantity - row.sold_ticket < ticketQuantity) {
            throw new Error(
              JSON.stringify("Ticket quantity exceeds issued remaining tickets")
            );
          }
          console.log(raffleId);
          console.log(userId);
          console.log(ticketQuantity);
          console.log("inserting into raffleTicket");
          insertedBids = await trx
            .insert(raffleTicketSale)
            .values({
              raffleId: raffleId,
              userId: userId,
              ticketQtn: ticketQuantity,
              createdAt: new Date(),
            })
            .returning();

          await trx
            .update(raffle)
            .set({
              soldTicket: (row.sold_ticket + ticketQuantity),
            })
            .where(eq(raffle.id, raffleId));
        });
        console.log("ticket added to the db and raffle updated");
        const bidId = insertedBids[0]?.id;
        await notificationQueue.add("raffle-ticketpurchase-success", {
          userId,
          raffleId,
          ticketQuantity,
        });
        const [userDetail] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));
        await connection.publish(
          `RAFFLE_TICKET_PURCHASED`,
          JSON.stringify({
            raffleId: raffleId,
            ticketQuantity: ticketQuantity,
            userId: userId,
            username: userDetail?.username || "",
            createdAt: insertedBids[0]?.createdAt,
          })
        );
        console.log("bid published to redis");
      } catch (e) {
        const refund = await createRefund(
          paymentIntentId,
          "requested_by_customer"
        );
        await db
          .update(paymentSession)
          .set({
            status: "FAILED",
            updatedAt: new Date(),
          })
          .where(eq(paymentSession.paymentIntentId, paymentIntentId));
        await notificationQueue.add("raffle-ticketpurchase-failed", {
          userId,
          raffleId,
          ticketQuantity,
          refund,
        });
        console.log(e);
      }
    }
  },
  { connection }
);

bidWorker.on("ready", () => {
  console.log("Bid Worker is ready and connected to Redis");
});

bidWorker.on("error", (e) => {
  console.log(e);
});

bidWorker.on("failed", (job, err: any) => {
  console.log("bid failed");
  console.log(job);

  // connection.publish(
  //   `BID_PLACED_ERROR`,
  //   JSON.stringify({
  //     error: err.message,
  //     payload: {
  //       auctionId: job?.data.auctionId,
  //       userId: job?.data.userId,
  //       bidAmount: job?.data.bidAmount,
  //       raffleId: job?.data.raffleId,
  //       ticketQuantity: job?.data.ticketQuantity,
  //     },
  //   })
  // );
  console.log(err);
});
