import { Worker } from "bullmq";
import { connection } from "../workerRedis";
import { db } from "../../db";
import {
  users,
  vehicles,
  auctions,
  contactAttempts,
  paymentSession,
  notifications,
  packages,
  userListingPackages,
  vehicleDrafts,
  auctionDrafts,
  numberPlate,
} from "../../../shared/schema";
import { eq, and } from "drizzle-orm";
import { auctionQueue, packageQueue } from "../queue";

const paymentWorker = new Worker(
  "payment",
  async (job) => {
    console.log(job.name);
    console.log(job.data);
    if (job.name === "processPackagePayment") {
      const { userId, draftId, paymentIntentId, packageId } = job.data;
      console.log(userId);
      console.log(draftId);
      console.log(paymentIntentId);
      console.log(packageId);
      try {
        const session = await db
          .select()
          .from(paymentSession)
          .where(eq(paymentSession.paymentIntentId, paymentIntentId))
          .limit(1);

        console.log("Payment session status " + session[0].status);
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

          console.log("updating the payment session");
          if (updated.length === 0) return;

          console.log("Fetching Package details");
          const [packageDetails] = await tx
            .select()
            .from(packages)
            .where(eq(packages.id, packageId));

          if (packageDetails) {
            const expires_at = new Date(
              Date.now() + packageDetails.duration_days * 24 * 60 * 60 * 1000
            );
            let listing_id;
            let globalDraftData: any;
            if (packageDetails.type == "CLASSIFIED") {
              console.log("Processing classified");
              //move draft to listing
              console.log("moving vehicle draft to listing");
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
                  expiresAt: expires_at,
                })
                .returning();
              listing_id = savedValue.id;
            } else if (packageDetails.type === "AUCTION") {
              console.log("processing auction");
              //move auction and vehicle draftdata

              console.log("Auction Draft Data");
              const [draftData] = await tx
                .select()
                .from(auctionDrafts)
                .where(eq(auctionDrafts.id, draftId));

              globalDraftData = draftData;
              let savedItemId: any;
              //move items from draft table to the listing table
              if (draftData.itemType === "VEHICLE") {
                console.log(
                  "Moving Vehicle Auction Item from draft to Listing"
                );
                const [row] = await tx
                  .select()
                  .from(vehicleDrafts)
                  .where(eq(vehicleDrafts.id, draftData.itemId as number));
                if (!row)
                  throw new Error(
                    "Draft Vehicle Data not found for draft Auction : " +
                      draftData.id
                  );
                // vehicle_draft_id= row.id
                const [savedValue] = await tx
                  .insert(vehicles)
                  .values({
                    registration_num: row.registration_num,
                    title: row.title,
                    price: row.price,
                    description: row.description,
                    year: row.year,
                    make: row.make,
                    model: row.model,
                    mileage: row.mileage,
                    transmission: row.transmission,
                    fuelType: row.fuelType,
                    bodyType: row.bodyType,
                    location: row.location,
                    latitude: row.latitude,
                    longitude: row.longitude,
                    images: row.images,
                    category: row.category,
                    condition: row.condition,
                    negotiable: row.negotiable,
                    openToPX: row.openToPX,
                    sellerId: row.sellerId,
                    color: row.color,
                    expiresAt: expires_at,
                  })
                  .returning();
                savedItemId = savedValue.id;
              } else if (draftData.itemType === "NUMBERPLATE") {
                console.log(
                  "Moving NumberPlate Auction Item from draft to Listing"
                );
                const [numberPlateRow] = await tx
                  .select()
                  .from(numberPlate)
                  .where(eq(numberPlate.id, draftData.itemId as number));
                if (!numberPlateRow)
                  throw new Error(
                    "Draft NumberPlate Data not found for draft Auction : " +
                      draftData.id
                  );

                await tx
                  .update(numberPlate)
                  .set({
                    status: "ACTIVE",
                  })
                  .returning();
                savedItemId = numberPlateRow.id;
              }
              console.log("Moving Auction from draft to listing");
              const [savedAuction] = await tx
                .insert(auctions)
                .values({
                  title: draftData.title,
                  description: draftData.description,
                  itemType: draftData.itemType,
                  itemId: savedItemId,
                  sellerId: draftData.sellerId,
                  startDate: draftData.startDate,
                  endDate: draftData.endDate,
                  startingPrice: draftData.startingPrice,
                })
                .returning();

              const delay = Math.max(
                0,
                savedAuction.startDate.getTime() - Date.now()
              );
              console.log("Pushing auction to auctionQueue");
              await auctionQueue.add(
                "startAuction",
                {
                  auctionId: savedAuction.id,
                  endTime: savedAuction.endDate,
                },
                {
                  delay: delay,
                  attempts: 3,
                  backoff: {
                    type: "exponential",
                    delay: 1000,
                  },
                }
              );
              listing_id = savedAuction.id;
            }

            if (!listing_id) throw new Error("listing_id is null");

            console.log("adding userlisting");
            //create userlistingpackage
            const [userPackageListingDetail] = await tx
              .insert(userListingPackages)
              .values({
                userId: userId,
                packageId: packageId,
                listing_id: listing_id as number,
                pricePaid: session[0].amount,
                vehicleValue: 0,
                purchased_at: new Date(),
                expires_at: expires_at,
              })
              .returning();

            //add auto package expiry logic
            await packageQueue.add(
              "expire-package",
              {
                userPackageListingId: userPackageListingDetail.id,
                listingId: listing_id,
              },
              {
                jobId: `user-listing-package:${userPackageListingDetail.id}`,
                delay: expires_at.getTime() - Date.now(),
                attempts: 3,
                backoff: {
                  type: "exponential",
                  delay: 1000,
                },
              }
            );
            console.log("updating payment session with listingId");
            await tx
              .update(paymentSession)
              .set({ listingId: listing_id })
              .where(and(eq(paymentSession.paymentIntentId, paymentIntentId)));

            if (packageDetails.type === "CLASSIFIED") {
              console.log("cleaning up vehicle draft");
              await tx
                .delete(vehicleDrafts)
                .where(eq(vehicleDrafts.id, draftId));
            } else if (packageDetails.type === "AUCTION") {
              console.log("cleaning up auction draft");
              await tx
                .delete(auctionDrafts)
                .where(eq(auctionDrafts.id, draftId));
              await tx
                .delete(vehicleDrafts)
                .where(eq(vehicleDrafts.id, globalDraftData.itemId));
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
