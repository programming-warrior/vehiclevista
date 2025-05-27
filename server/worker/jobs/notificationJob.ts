import { Worker } from "bullmq";
import { connection } from "../workerRedis";
import { db } from "../../db";
import {
  users,
  vehicles,
  contactAttempts,
  notifications,
} from "../../../shared/schema";
import { eq } from "drizzle-orm";

const notificationWorker = new Worker(
  "notification",
  async (job) => {
    console.log(job.name);
    console.log(job.data);
    if (job.name === "contact-seller") {
      const { messageId, userId, vehicleId, sellerId, message } = job.data;

      try {
        const [seller] = await db
          .select()
          .from(users)
          .where(eq(sellerId, users.id));
        const [buyer] = await db
          .select()
          .from(users)
          .where(eq(userId, users.id));
        const [vehicle] = await db
          .select()
          .from(vehicles)
          .where(eq(vehicleId, vehicles.id));

        if (!seller || !buyer || !vehicle) throw new Error("Invalid data");

        const formattedMessage = {
          title: `Enquiry About | ${vehicle.make} ${vehicle.model} ${vehicle.year}`,
          from: {
            name: `${buyer.username}`,
            email: `${buyer.email}`,
          },
          body: message,
        };

        const [notification] = await db
          .insert(notifications)
          .values({
            type: 'CONTACT_SELLER',
            sentTo: seller.id,
            message: formattedMessage,
          })
          .returning();

        await connection.publish(
          `RECEIVE_NOTIFICATION`,
          JSON.stringify({
            type: "CONTACT_SELLER",
            notificationId: notification.id,
            to: seller.id,
            message: formattedMessage,
          })
        );

        await db
          .update(contactAttempts)
          .set({ deliveryStatus: "delivered" })
          .where(eq(messageId, contactAttempts.id));
      } catch (e) {
        await db
          .update(contactAttempts)
          .set({ deliveryStatus: "failed" })
          .where(eq(messageId, contactAttempts.id));
        console.log(e);
      }
    }
  },
  {
    connection
  }
);

notificationWorker.on("ready", () => {
  console.log("notification Worker is ready and connected to Redis");
});

notificationWorker.on("error", (e) => {
  console.log(e);
});

notificationWorker.on("failed", (job, err: any) => {
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
        ticketQuantity: job?.data.ticketQuantity,
      },
    })
  );
  console.log(err);
});
