import { Worker } from "bullmq";
import { connection } from "../workerRedis";
import { db } from "../../db";
import {
  users,
  vehicles,
  contactAttempts,
  paymentSession,
  notifications,
  packages,
  userListingPackages,
  vehicleDrafts,
} from "../../../shared/schema";
import { eq, and } from "drizzle-orm";

const paymentWorker = new Worker(
  "payment",
  async (job) => {
    console.log(job.name);
    console.log(job.data);
    if (job.name === "processPackagePayment") {
      const { userId, draftId, paymentIntentId, packageId } = job.data;

      try {
        const session = await db
          .select()
          .from(paymentSession)
          .where(eq(paymentSession.paymentIntentId, paymentIntentId))
          .limit(1);

        if (!session || session[0].status !== "PENDING") return;

        await db.transaction(async (tx) => {
          //update the payment session
          const updated = await tx
            .update(paymentSession)
            .set({ status: "SUCCEEDED", draftId: null, updatedAt: new Date() })
            .where(
              and(
                eq(paymentSession.paymentIntentId, paymentIntentId),
                eq(paymentSession.status, "PENDING")
              )
            )
            .returning();

          if (updated.length === 0) return;

          const [packageDetails] = await tx
            .select()
            .from(packages)
            .where(eq(packages.id, packageId));
          if (packageDetails) {
            let listing_id;
            if (packageDetails.type == "CLASSIFIED") {
              //move draft to listing
              const [draftData] = await tx
                .select()
                .from(vehicleDrafts)
                .where(eq(vehicleDrafts.id, draftId));
              const [savedValue] = await tx
                .insert(vehicles)
                .values({
                  registration_num: draftData.registration_num,
                  title: draftData.title,
                  price: draftData.price,
                  description: draftData.description,
                  year: draftData.year,
                  make: draftData.make,
                  model: draftData.model,
                  mileage: draftData.mileage,
                  transmission: draftData.transmission,
                  fuelType: draftData.fuelType,
                  bodyType: draftData.bodyType,
                  location: draftData.location,
                  latitude: draftData.latitude,
                  longitude: draftData.longitude,
                  images: draftData.images,
                  category: draftData.category,
                  condition: draftData.condition,
                  negotiable: draftData.negotiable,
                  openToPX: draftData.openToPX,
                  sellerId: draftData.sellerId,
                  color: draftData.color,
                })
                .returning();
              listing_id = savedValue.id;
            }

            const expires_at = new Date(
              Date.now() + packageDetails.duration_days * 24 * 60 * 60 * 1000
            );
            //create userlistingpackage
            await tx.insert(userListingPackages).values({
              userId: userId,
              packageId: packageId,
              listing_id: listing_id as number,
              pricePaid: session[0].amount,
              vehicleValue: 0,
              purchased_at: new Date(),
              expires_at: expires_at,
            });
            await tx
              .update(paymentSession)
              .set({ listingId: listing_id })
              .where(and(eq(paymentSession.paymentIntentId, paymentIntentId)));

            if (packageDetails.type === "CLASSIFIED") {
              await tx
                .delete(vehicleDrafts)
                .where(eq(vehicleDrafts.id, draftId));
            }
          }
        });
      } catch (e) {
        console.log(e);
      }
    }
  },
  {
    connection,
  }
);

paymentWorker.on("ready", () => {
  console.log("payment Worker is ready and connected to Redis");
});

paymentWorker.on("error", (e) => {
  console.log(e);
});

paymentWorker.on("failed", (job, err: any) => {
  console.log("bid failed");
  console.log(job);

  console.log(err);
});
