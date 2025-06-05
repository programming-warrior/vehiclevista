import Stripe from "stripe";

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