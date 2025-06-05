import { Router } from "express";
import { db } from "../db";
import {
  packages,
  offers,
  vehicleDrafts,
  paymentSession,
  auctionDrafts,
  numberPlate,
} from "../../shared/schema";
import { eq, lte, or, gte, and, sql, inArray, ilike } from "drizzle-orm";
import RedisClientSingleton from "../utils/redis";
import { CURRENCY } from "../utils/constants";

import { verifyToken } from "../middleware/authMiddleware";
import { stripe } from "../utils/stripe";
import { paymentQueue } from "../worker/queue";
// const redisClient = RedisClientSingleton.getInstance().getRedisClient();
const packageRouter = Router();

packageRouter.post("/evaluate-price", verifyToken, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    let { type, vehicle_price } = req.body;
    if (!type || !vehicle_price) {
      return res
        .status(400)
        .json({ message: "Type and vehicle price are required" });
    }

    //check for any discount
    let saved_packages: any = {};
    const result = await db
      .select()
      .from(packages)
      .where(
        and(
          eq(packages.is_active, true),
          eq(packages.type, type.toUpperCase() as string)
        )
      );
    saved_packages = result.map((r: any) => {
      console.log(r.prices);
      let chargeable_amount = 0;
      r.prices.forEach((p: any) => {
        if (p[0] <= vehicle_price) {
          if (p[1] > -1 && p[1] >= vehicle_price) {
            chargeable_amount = p[2] ?? vehicle_price;
          }
        }
      });
      console.log(chargeable_amount);

      return {
        id: r.id,
        name: r.name,
        prices: r.prices,
        features: r.features,
        duration_days: r.duration_days,
        is_until_sold: r.is_until_sold,
        is_rebookable: r.is_rebookable,
        amount: chargeable_amount,
      };
    });

    // const offer = await db
    //   .select()
    //   .from(offers)
    //   .where(eq(offers.status, "ACTIVE"));

    res.status(200).json(saved_packages);
  } catch (err: any) {
    console.error("Error fetching packages:", err);
    res.status(500).json({ message: "Error fetching packages" });
  }
});

packageRouter.post("/select", verifyToken, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    let { package_id, draft_id, type } = req.body;
    if (!package_id || !draft_id || !["CLASSIFIED", "AUCTION"].includes(type)) {
      return res
        .status(400)
        .json({ message: "Package ID and Draft ID are required" });
    }

    const [res_pkg] = await db
      .select()
      .from(packages)
      .where(
        and(eq(packages.is_active, true), eq(packages.id, package_id as number))
      );

    if (!res_pkg) {
      return res.status(404).json({ message: "Package not found" });
    }
    let vehiclePrice: number | undefined;
    let plateNumber: number | undefined;

    if (type === "CLASSIFIED") {
      const [draft_vehicle] = await db
        .select()
        .from(vehicleDrafts)
        .where(eq(vehicleDrafts.id, draft_id as number));
      if (!draft_vehicle || draft_vehicle.sellerId !== req.userId) {
        return res.status(404).json({ message: "Draft vehicle not found" });
      }
      vehiclePrice = draft_vehicle.price;
    } else if (type === "AUCTION") {
      const [draft_auction] = await db
        .select()
        .from(auctionDrafts)
        .where(eq(auctionDrafts.id, draft_id as number));
      if (!draft_auction || draft_auction.sellerId !== req.userId) {
        return res.status(404).json({ message: "Draft auction not found" });
      }
      console.log(draft_auction);
      if (draft_auction.itemType === "VEHICLE") {
        const [draft_vehicle] = await db
          .select()
          .from(vehicleDrafts)
          .where(eq(vehicleDrafts.id, draft_auction.itemId as number));
        if (!draft_vehicle) {
          return res
            .status(404)
            .json({ message: "Related vehicle draft not found" });
        }
        vehiclePrice = draft_vehicle.price;
      } else if (draft_auction.itemType === "NUMBERPLATE") {
        const [draft_numberPlate] = await db
          .select()
          .from(numberPlate)
          .where(eq(numberPlate.id, draft_auction.itemId as number));
        if (!draft_numberPlate) {
          return res
            .status(404)
            .json({ message: "Related numberplate draft not found" });
        }
        plateNumber = parseInt(draft_numberPlate.plate_number);
      }
    }

    const prices = res_pkg.prices as [number, number, number][];
    console.log(prices);

    let compareFeature: number = vehiclePrice
      ? (vehiclePrice as number)
      : (plateNumber as number);

    const amount = prices.reduce((acc: number, price: any) => {
      if (price[0] <= compareFeature) {
        if (price[1] > -1 && price[1] >= compareFeature) {
          acc = price[2] ?? compareFeature;
        }
      }
      return acc;
    }, 0);
    if (amount == 0)
      return res
        .status(400)
        .json({ message: "Invalid package for the vehicle price" });
    console.log(amount);
    const amountInPence = Math.round(amount * 100);
    //create payment session
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPence,
      currency: CURRENCY,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        packageId: package_id.toString(),
        draftId: draft_id.toString(),
        userId: req.userId.toString(),
      },
    });

    const [payment_session] = await db
      .insert(paymentSession)
      .values({
        userId: req.userId,
        packageId: package_id,
        draftId: draft_id,
        amount,
        currency: CURRENCY,
        status: "PENDING",
        paymentIntentId: paymentIntent.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      })
      .returning();

    const redis = await RedisClientSingleton.getRedisClient();
    await redis.set(
      `paymentSession:${paymentIntent.id}`,
      JSON.stringify({
        userId: req.userId,
        status: "PENDING",
        draftId: draft_id,
        packageId: package_id,
      }),
      { EX: 1800 }
    );

    return res.status(200).json({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      paymentSessionId: payment_session.id,
      amount: payment_session.amount,
      currency: payment_session.currency,
      isFree: false,
    });
  } catch (err: any) {
    console.error("Error fetching packages:", err);
    res.status(500).json({ message: "Error fetching packages" });
  }
});

packageRouter.post("/verify-payment", verifyToken, async (req, res) => {
  if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
  const { paymentIntentId } = req.body;

  if (!paymentIntentId) {
    return res.status(400).json({ error: "Missing paymentIntentId" });
  }
  const redis = await RedisClientSingleton.getRedisClient();

  let packageId, draftId;

  const payment_session_redis = await redis.get(
    `paymentSession:${paymentIntentId}`
  );

  if (payment_session_redis) {
    const parsedPaymentSession = JSON.parse(payment_session_redis);
    if (parsedPaymentSession.userId != req.userId) {
      return res.status(401).json({
        error: "You are not authorized to validate this payment",
      });
    }
    packageId = parsedPaymentSession.packageId;
    draftId = parsedPaymentSession.draftId;
  } else {
    const [payment_session_db] = await db
      .select()
      .from(paymentSession)
      .where(eq(paymentSession.paymentIntentId, paymentIntentId));
    if (payment_session_db.userId !== req.userId) {
      return res.status(401).json({
        error: "You are not authorized to validate this payment",
      });
    }
    packageId = payment_session_db.packageId;
    draftId = payment_session_db.draftId;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      await redis.del(`paymentSession:${paymentIntentId}`);
      await paymentQueue.add("processPackagePayment", {
        userId: req.userId,
        paymentIntentId,
        packageId,
        draftId,
      });
      return res.status(200).json({ success: true });
    } else {
      return res.status(400).json({ error: "Payment not successful yet" });
    }
  } catch (err) {
    console.error("Stripe verification error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default packageRouter;
