import { Worker } from "bullmq";
import { connection } from "../workerRedis";
import { db } from "../../db";
import { eq, and } from "drizzle-orm";
import {
  userListingPackages,
  vehicles,
  auctions,
  packages,
} from "@shared/schema";
import { packageQueue } from "../queue";

const packageJob = new Worker(
  "package",
  async (job) => {
    console.log(job.name);
    console.log(job.data);
    if (job.name === "expire-package") {
      const { userPackageListingId, listingId } = job.data;
      const [userPackage] = await db
        .select()
        .from(userListingPackages)
        .where(eq(userListingPackages.id, userPackageListingId));

      if (!userPackage?.is_active) return;

      const [packageDetail] = await db
        .select()
        .from(packages)
        .where(eq(packages.id, userPackage.packageId));

      if (packageDetail.type === "CLASSIFIED") {
        const [userVehicle] = await db
          .select()
          .from(vehicles)
          .where(eq(vehicles.id, listingId));

        if (!userVehicle) return;

        await db.transaction(async (tx) => {
          await tx
            .update(userListingPackages)
            .set({ is_active: false })
            .where(
              and(
                eq(userListingPackages.id, userPackageListingId),
                eq(userListingPackages.is_active, true)
              )
            );
          await tx
            .update(vehicles)
            .set({ listingStatus: "EXPIRED" })
            .where(
              and(
                eq(vehicles.id, listingId),
                eq(vehicles.listingStatus, "ACTIVE")
              )
            );
        });
      } else if (
        packageDetail.type.split("-")[0] &&
        packageDetail.type.split("-")[0] === "AUCTION"
      ) {
        const [userAuction] = await db
          .select()
          .from(auctions)
          .where(eq(auctions.id, listingId));

        if (!userAuction) return;

        await db
          .update(userListingPackages)
          .set({ is_active: false })
          .where(
            and(
              eq(userListingPackages.id, userPackageListingId),
              eq(userListingPackages.is_active, true)
            )
          );
      }
    }
  },
  { connection }
);

async function initPackageExpiry() {
  console.log(
    "Initializing package expiry for packages that might have been missed being pushed to the queue"
  );
  try {
    const activePackages: any = await db
      .select()
      .from(userListingPackages)
      .where(eq(userListingPackages.is_active, true));

    for (const pkg of activePackages) {
      const delay = Math.max(
        0,
        new Date(pkg.expires_at).getTime() - Date.now()
      );

      // Re-schedule the job with the correct delay
      try {
      
        await packageQueue.add(
          "expire-package",
          {
            userPackageListingId: pkg.id,
            listingId: pkg.listing_id,
          },
          {
            jobId: `user-listing-package:${pkg.id}`,
            delay: delay,
          }
        );
      } catch (error: any) {
        console.error(
          `Failed to reschedule start job for user-listing-package ${pkg.id}:`,
          error
        );
      }
    }
  } catch (e: any) {
    console.error("Error in initPackageExpiry:", e);
    throw e;
  }
}

initPackageExpiry()
  .then(() => {
    console.log(
      "----------------Expired leftout packages added ---------"
    );
  })
  .catch((error) => {
    console.error("Error initializing :", error);
  });

packageJob.on("ready", () => {
  console.log("package Worker is ready and connected to Redis");
});

packageJob.on("error", (e) => {
  console.log(e);
});

packageJob.on("failed", (job, err: any) => {
  console.log("package failed");
  console.log(job);
  console.log(err);
});
