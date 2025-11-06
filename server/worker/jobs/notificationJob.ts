import { Worker } from "bullmq";
import { connection } from "../workerRedis";
import { db } from "../../db";
import {
  users,
  vehicles,
  contactAttempts,
  notifications,
  auctions,
  raffle,
  bids,
  packages,
  refunds,
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
            type: "CONTACT_SELLER",
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
            createdAt: notification.createdAt,
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
    } else if (job.name === "auctionBid-placed-success") {
      const { bidId, userId, auctionId } = job.data;

      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(userId, users.id));

        const [auction] = await db
          .select()
          .from(auctions)
          .where(eq(auctionId, auctions.id));

        const [bid] = await db.select().from(bids).where(eq(bids.id, bidId));

        if (!auction || !user || !bid) throw new Error("Invalid data");

        const formattedMessage = {
          title: `Auction Bid ${bid.bidAmount} placed successfully`,
          from: {
            name: `system-generated`,
            email: `system-generated`,
          },
          body: `Your bid for auction | ${auction.title} for amount ${bid.bidAmount} is successfull`,
        };
        console.log(formattedMessage);
        const [notification] = await db
          .insert(notifications)
          .values({
            type: "AUCTION-BID",
            sentTo: user.id,
            message: formattedMessage,
          })
          .returning();
        console.log("notificaton saved to the database");
        await connection.publish(
          `RECEIVE_NOTIFICATION`,
          JSON.stringify({
            type: "AUCTION-BID",
            notificationId: notification.id,
            to: userId,
            message: formattedMessage,
            createdAt: notification.createdAt,
          })
        );
        console.log("notification published");
      } catch (e) {
        console.log(e);
      }
    } else if (job.name === "auctionBid-placed-failed") {
      const { userId, auctionId, bidAmount, refund } = job.data;

      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));

        const [auction] = await db
          .select()
          .from(auctions)
          .where(eq(auctions.id, parseInt(auctionId)));

        // const [bid] = await db.select().from(bids).where(eq(bids.id, bidId));

        if (!auction || !user) throw new Error("Invalid data");

        const formattedMessage = {
          title: `Auction Bid for ${bidAmount} Failed `,
          from: {
            name: `system-generated`,
            email: `system-generated`,
          },
          body: `Your bid for auction | ${auction.title} for amount ${bidAmount} has failed. Refund has been initiated!`,
        };
        console.log(formattedMessage);

        const [notification] = await db
          .insert(notifications)
          .values({
            type: "AUCTION-BID",
            sentTo: user.id,
            message: formattedMessage,
          })
          .returning();

        console.log("notification saved");
        await connection.publish(
          `RECEIVE_NOTIFICATION`,
          JSON.stringify({
            type: "AUCTION-BID",
            notificationId: notification.id,
            to: userId,
            message: formattedMessage,
            createdAt: notification.createdAt,
          })
        );
        console.log("notification published");
      } catch (e) {
        console.log(e);
      }
    } else if (job.name === "auctionBid-placed-success") {
      const { bidId, userId, auctionId } = job.data;

      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(userId, users.id));

        const [auction] = await db
          .select()
          .from(auctions)
          .where(eq(auctionId, auctions.id));

        const [bid] = await db.select().from(bids).where(eq(bids.id, bidId));

        if (!auction || !user || !bid) throw new Error("Invalid data");

        const formattedMessage = {
          title: `Auction Bid ${bid.bidAmount} placed successfully`,
          from: {
            name: `system-generated`,
            email: `system-generated`,
          },
          body: `Your bid for auction | ${auction.title} for amount ${bid.bidAmount} is successfull`,
        };
        console.log(formattedMessage);
        const [notification] = await db
          .insert(notifications)
          .values({
            type: "AUCTION-BID",
            sentTo: user.id,
            message: formattedMessage,
          })
          .returning();
        console.log("notificaton saved to the database");
        await connection.publish(
          `RECEIVE_NOTIFICATION`,
          JSON.stringify({
            type: "AUCTION-BID",
            notificationId: notification.id,
            to: userId,
            message: formattedMessage,
            createdAt: notification.createdAt,
          })
        );
        console.log("notification published");
      } catch (e) {
        console.log(e);
      }
    } else if (job.name === "raffle-ticketpurchase-success") {
      const { userId, raffleId, ticketQuantity } = job.data;

      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));

        const [_raffle] = await db
          .select()
          .from(raffle)
          .where(eq(raffle.id, parseInt(raffleId)));

        // const [bid] = await db.select().from(bids).where(eq(bids.id, bidId));

        if (!_raffle || !user) throw new Error("Invalid data");

        const formattedMessage = {
          title: `Raffle ${ticketQuantity} tickets purchased successfully `,
          from: {
            name: `system-generated`,
            email: `system-generated`,
          },
          body: `Your ticket purchase for raffle | ${_raffle.title} of quantity ${ticketQuantity} has been successfull!`,
        };
        console.log(formattedMessage);

        const [notification] = await db
          .insert(notifications)
          .values({
            type: "RAFFLE-TICKET-PURCHASE",
            sentTo: user.id,
            message: formattedMessage,
          })
          .returning();

        console.log("notification saved");
        await connection.publish(
          `RECEIVE_NOTIFICATION`,
          JSON.stringify({
            type: "RAFFLE-TICKET-PURCHASE",
            notificationId: notification.id,
            to: userId,
            message: formattedMessage,
            createdAt: notification.createdAt,
          })
        );
        console.log("notification published");
      } catch (e) {
        console.log(e);
      }
    } else if (job.name === "raffle-ticketpurchase-failed") {
      const { userId, raffleId, ticketQuantity, refund } = job.data;

      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));

        const [_raffle] = await db
          .select()
          .from(raffle)
          .where(eq(raffle.id, parseInt(raffleId)));

        // const [bid] = await db.select().from(bids).where(eq(bids.id, bidId));

        if (!_raffle || !user) throw new Error("Invalid data");

        const formattedMessage = {
          title: `Raffle ${ticketQuantity} tickets purchase failed `,
          from: {
            name: `system-generated`,
            email: `system-generated`,
          },
          body: `Your ticket purchase for raffle | ${_raffle.title} of quantity ${ticketQuantity} has failed. Refund has been initiated!`,
        };
        console.log(formattedMessage);

        const [notification] = await db
          .insert(notifications)
          .values({
            type: "RAFFLE-TICKET-PURCHASE",
            sentTo: user.id,
            message: formattedMessage,
          })
          .returning();

        console.log("notification saved");
        await connection.publish(
          `RECEIVE_NOTIFICATION`,
          JSON.stringify({
            type: "RAFFLE-TICKET-PURCHASE",
            notificationId: notification.id,
            to: userId,
            message: formattedMessage,
            createdAt: notification.createdAt,
          })
        );
        console.log("notification published");
      } catch (e) {
        console.log(e);
      }
    } else if (job.name === "listing-creation-success") {
      const { userId, listingId, packageId } = job.data;

      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));

        const [packageDetails] = await db
          .select()
          .from(packages)
          .where(eq(packages.id, parseInt(packageId)));

        // const [bid] = await db.select().from(bids).where(eq(bids.id, bidId));

        if (!packageDetails || !user) throw new Error("Invalid data");

        const formattedMessage = {
          title: `Listing created successfully`,
          from: {
            name: `system-generated`,
            email: `system-generated`,
          },
          body: `Your listing for package *${packageDetails.name}* has been created successfully!`,
        };
        console.log(formattedMessage);

        const [notification] = await db
          .insert(notifications)
          .values({
            type: "LISTING-CREATION-SUCCESS",
            sentTo: user.id,
            message: formattedMessage,
          })
          .returning();

        console.log("notification saved");
        await connection.publish(
          `RECEIVE_NOTIFICATION`,
          JSON.stringify({
            type: "LISTING-CREATION-SUCCESS",
            notificationId: notification.id,
            to: userId,
            message: formattedMessage,
            createdAt: notification.createdAt,
          })
        );
        console.log("notification published");
      } catch (e) {
        console.log(e);
      }
    } else if (job.name === "listing-creation-failed") {
      const { userId, draftId, packageId } = job.data;

      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));

        const [packageDetails] = await db
          .select()
          .from(packages)
          .where(eq(packages.id, parseInt(packageId)));

        // const [bid] = await db.select().from(bids).where(eq(bids.id, bidId));

        if (!packageDetails || !user) throw new Error("Invalid data");

        const formattedMessage = {
          title: `Listing Creation Failed`,
          from: {
            name: `system-generated`,
            email: `system-generated`,
          },
          body: `Your listing for package *${packageDetails.name}* has failed to create. Refund would be initiated`,
        };
        console.log(formattedMessage);

        const [notification] = await db
          .insert(notifications)
          .values({
            type: "LISTING-CREATION-FAILED",
            sentTo: user.id,
            message: formattedMessage,
          })
          .returning();

        console.log("notification saved");
        await connection.publish(
          `RECEIVE_NOTIFICATION`,
          JSON.stringify({
            type: "LISTING-CREATION-FAILED",
            notificationId: notification.id,
            to: userId,
            message: formattedMessage,
            createdAt: notification.createdAt,
          })
        );
        console.log("notification published");
      } catch (e) {
        console.log(e);
      }
    } else if ((job.name = "raffle-winner")) {
      const { winnerUserId, raffleId } = job.data;
      try {
        const [raffleData] = await db
          .select()
          .from(raffle)
          .where(eq(raffle.id, raffleId));
        const [userData] = await db
          .select()
          .from(users)
          .where(eq(users.id, winnerUserId));
        if (!raffleData || !userData) {
          throw new Error("invalid raffleId or winnerUserId");
        }
        const formattedMessage = {
          title: `Winner Declared for Raffle ${raffleData.title}`,
          from: {
            name: `system-generated`,
            email: `system-generated`,
          },
          body: `User ${userData.username} is the winner`,
        };

        console.log(formattedMessage);

        const [notification] = await db
          .insert(notifications)
          .values({
            type: "RAFFLE",
            sentTo: winnerUserId,
            message: formattedMessage,
          })
          .returning();

        console.log("notification saved");
        await connection.publish(
          `RECEIVE_NOTIFICATION`,
          JSON.stringify({
            type: "RAFFLE",
            notificationId: notification.id,
            to: winnerUserId,
            message: formattedMessage,
            createdAt: notification.createdAt,
          })
        );
      } catch (e) {
        console.log(e);
      }
    } else if (job.name === "user-suspended") {
      const { userId, reason, suspendedBy } = job.data;

      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));

        if (!user) return;

        const formattedMessage = {
          title: `Account Suspended`,
          from: {
            name: `system-generated`,
            email: `system-generated`,
          },
          body: `Your account has been suspended. Reason: ${reason}. You can only view public content until your account is reinstated.`,
        };

        const [notification] = await db
          .insert(notifications)
          .values({
            type: "ACCOUNT_SUSPENDED",
            sentTo: user.id,
            message: formattedMessage,
          })
          .returning();

        await connection.publish(
          `USER_SUSPENDED:${userId}`,
          JSON.stringify({
            type: "ACCOUNT_SUSPENDED",
            notificationId: notification.id,
            userId: userId,
            message: formattedMessage,
            reason: reason,
            createdAt: notification.createdAt,
          })
        );
      } catch (e) {
        console.log(e);
      }
    } else if (job.name === "user-unsuspended") {
      const { userId, unsuspendedBy } = job.data;

      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));

        if (!user) return;

        const formattedMessage = {
          title: `Account Reinstated`,
          from: {
            name: `system-generated`,
            email: `system-generated`,
          },
          body: `Good news! Your account has been reinstated. You now have full access to all features.`,
        };

        const [notification] = await db
          .insert(notifications)
          .values({
            type: "ACCOUNT_UNSUSPENDED",
            sentTo: user.id,
            message: formattedMessage,
          })
          .returning();

        await connection.publish(
          `USER_UNSUSPENDED:${userId}`,
          JSON.stringify({
            type: "ACCOUNT_UNSUSPENDED",
            notificationId: notification.id,
            userId: userId,
            message: formattedMessage,
            createdAt: notification.createdAt,
          })
        );
      } catch (e) {
        console.log(e);
      }
    } else if (job.name === "refund-completed") {
      const { userId, refundId, amount, reason } = job.data;

      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));

        if (!user) throw new Error("User not found");

        // Format reason for display
        const reasonMap: Record<string, string> = {
          AUCTION_CREATION_FAILED: "Auction listing creation failed",
          CLASSIFIED_CREATION_FAILED: "Classified listing creation failed",
          BID_FAILED: "Bid placement failed",
          RAFFLE_TICKET_FAILED: "Raffle ticket purchase failed",
          CONDITION_NOT_MET: "Payment condition not met",
          REQUESTED_BY_ADMIN: "Refund requested by administrator",
          OTHER: "Refund processed",
        };

        const formattedReason = reasonMap[reason] || "Refund processed";

        const formattedMessage = {
          title: `Refund Completed - £${amount.toFixed(2)}`,
          from: {
            name: "VehicleVista Billing",
            email: "billing@vehiclevista.com",
          },
          body: `Your refund of £${amount.toFixed(2)} has been successfully processed. Reason: ${formattedReason}. The funds should appear in your account within 5-10 business days.`,
        };

        console.log("Creating refund completion notification:", formattedMessage);

        const [notification] = await db
          .insert(notifications)
          .values({
            type: "REFUND_COMPLETED",
            sentTo: user.id,
            message: formattedMessage,
          })
          .returning();

        console.log("Notification saved, publishing to Redis");

        await connection.publish(
          `RECEIVE_NOTIFICATION`,
          JSON.stringify({
            type: "REFUND_COMPLETED",
            notificationId: notification.id,
            to: userId,
            message: formattedMessage,
            createdAt: notification.createdAt,
          })
        );

        console.log("Refund notification published successfully");
      } catch (e) {
        console.error("Failed to send refund notification:", e);
      }
    }
  },
  {
    connection,
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
  console.log(err);
});
