import { Router, Request, Response } from "express";
import { stripe } from "../utils/stripe";
import { db } from "../db";
import { refunds } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { notificationQueue } from "../worker/queue";

const webhookRouter = Router();

// Stripe webhook endpoint
// Note: This must be BEFORE express.json() middleware in index.ts
webhookRouter.post(
  "/stripe",
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      return res.status(400).send("Missing stripe-signature header");
    }

    let event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (err: any) {
      console.error(`⚠️  Webhook signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    console.log(`📨 Received webhook event: ${event.type}`);

    try {
      switch (event.type) {
        case "charge.refunded":
          await handleRefundSucceeded(event.data.object);
          break;

        case "charge.refund.updated":
          await handleRefundUpdated(event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error(`Error processing webhook:`, error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Handle successful refund
 */
async function handleRefundSucceeded(charge: any) {
  console.log(`✅ Refund succeeded for charge: ${charge.id}`);
  
  const paymentIntentId = charge.payment_intent;
  
  if (!paymentIntentId) {
    console.error("No payment intent ID found in refund");
    return;
  }

  // Find the refund record in our database
  const refundRecords = await db
    .select()
    .from(refunds)
    .where(eq(refunds.paymentIntentId, paymentIntentId));

  if (refundRecords.length === 0) {
    console.error(`No refund record found for payment intent: ${paymentIntentId}`);
    return;
  }

  // Update all refunds for this payment intent to COMPLETED
  for (const refundRecord of refundRecords) {
    if (refundRecord.status === "PROCESSING") {
      await db
        .update(refunds)
        .set({
          status: "COMPLETED",
          completedAt: new Date(),
        })
        .where(eq(refunds.id, refundRecord.id));

      console.log(`✅ Refund ${refundRecord.id} marked as COMPLETED`);

      // Now send notification to user
      await notificationQueue.add("refund-completed", {
        userId: refundRecord.userId,
        refundId: refundRecord.id,
        amount: refundRecord.amount,
        reason: refundRecord.reason,
      });

      console.log(`📧 Notification queued for user ${refundRecord.userId}`);
    }
  }
}

/**
 * Handle refund update (in case of failure)
 */
async function handleRefundUpdated(refund: any) {
  console.log(`🔄 Refund updated: ${refund.id}, status: ${refund.status}`);
  
  const stripeRefundId = refund.id;

  // Find the refund record by Stripe refund ID
  const refundRecords = await db
    .select()
    .from(refunds)
    .where(eq(refunds.stripeRefundId, stripeRefundId));

  if (refundRecords.length === 0) {
    console.error(`No refund record found for Stripe refund: ${stripeRefundId}`);
    return;
  }

  for (const refundRecord of refundRecords) {
    if (refund.status === "failed" || refund.status === "canceled") {
      // Mark refund as failed
      await db
        .update(refunds)
        .set({
          status: "FAILED",
          errorMessage: refund.failure_reason || "Refund failed or was canceled",
        })
        .where(eq(refunds.id, refundRecord.id));

      console.log(`❌ Refund ${refundRecord.id} marked as FAILED`);
    } else if (refund.status === "succeeded") {
      // Mark as completed (in case we missed the charge.refunded event)
      await db
        .update(refunds)
        .set({
          status: "COMPLETED",
          completedAt: new Date(),
        })
        .where(eq(refunds.id, refundRecord.id));

      // Send notification
      await notificationQueue.add("refund-completed", {
        userId: refundRecord.userId,
        refundId: refundRecord.id,
        amount: refundRecord.amount,
        reason: refundRecord.reason,
      });

      console.log(`✅ Refund ${refundRecord.id} marked as COMPLETED (via update)`);
    }
  }
}

export default webhookRouter;
