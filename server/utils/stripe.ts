import Stripe from "stripe";
import { db } from "../db";
import { refunds, users } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { notificationQueue } from "../worker/queue";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function createRefund(
  paymentIntentId: string,
  reason: "duplicate" | "fraudulent" | "requested_by_customer" = "requested_by_customer",
  amount?: number
) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason,
      ...(amount && { amount }), 
    });
    return refund;
  } catch (error: any) {
    console.error('Refund creation failed:', error);
    throw new Error(`Refund failed: ${error.message}`);
  }
}

/**
 * Create and process a refund with complete logging and notifications
 * @param userId - The user receiving the refund
 * @param paymentIntentId - Stripe payment intent ID
 * @param amount - Amount to refund (in smallest currency unit, e.g., cents/pence)
 * @param refundReason - Reason code for the refund
 * @param reasonDetails - Additional context about the refund
 * @param listingId - Optional listing ID if related to auction/classified
 * @param listingType - Type of listing (AUCTION, CLASSIFIED, RAFFLE)
 * @param bidId - Optional bid ID if related to bid failure
 * @param packageId - Optional package ID if related to package purchase
 */
export async function createAndLogRefund(params: {
  userId: number;
  paymentIntentId: string;
  amount: number;
  refundReason: "AUCTION_CREATION_FAILED" | "CLASSIFIED_CREATION_FAILED" | "BID_FAILED" | "RAFFLE_TICKET_FAILED" | "CONDITION_NOT_MET" | "REQUESTED_BY_ADMIN" | "OTHER";
  reasonDetails?: string;
  listingId?: number;
  listingType?: string;
  bidId?: number;
  packageId?: number;
  processedBy?: number;
}) {
  const {
    userId,
    paymentIntentId,
    amount,
    refundReason,
    reasonDetails,
    listingId,
    listingType,
    bidId,
    packageId,
    processedBy
  } = params;

  let refundRecord;
  
  try {
    // Create refund record in database with PENDING status
    [refundRecord] = await db
      .insert(refunds)
      .values({
        userId,
        paymentIntentId,
        amount: amount / 100, // Convert from cents to currency unit
        currency: "gbp",
        reason: refundReason,
        reasonDetails: reasonDetails || null,
        status: "PENDING",
        listingId: listingId || null,
        listingType: listingType || null,
        bidId: bidId || null,
        packageId: packageId || null,
        processedBy: processedBy || null,
      })
      .returning();

    console.log(`Refund record created with ID: ${refundRecord.id}`);

    // Process the actual Stripe refund
    const stripeRefund = await createRefund(
      paymentIntentId,
      "requested_by_customer",
      amount
    );

    console.log(`Stripe refund processed: ${stripeRefund.id}`);

    // Update refund record with success status
    await db
      .update(refunds)
      .set({
        status: "COMPLETED",
        stripeRefundId: stripeRefund.id,
        completedAt: new Date(),
      })
      .where(eq(refunds.id, refundRecord.id));

    console.log(`Refund completed successfully for user ${userId}`);

    // Queue notification to user about successful refund
    await notificationQueue.add("refund-completed", {
      userId,
      refundId: refundRecord.id,
      amount: refundRecord.amount,
      reason: refundReason,
    });

    return {
      success: true,
      refundRecord,
      stripeRefund,
    };
  } catch (error: any) {
    console.error(`Refund failed for user ${userId}:`, error);

    // Update refund record with FAILED status if it was created
    if (refundRecord) {
      await db
        .update(refunds)
        .set({
          status: "FAILED",
          errorMessage: error.message || "Unknown error",
        })
        .where(eq(refunds.id, refundRecord.id));
    }

    throw error;
  }
}