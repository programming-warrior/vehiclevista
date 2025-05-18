import { Worker } from "bullmq";
import { connection } from "../workerRedis";
// import { WebSocketServer } from './websocket'; // assume you have a pub function
import { db } from "../../db";
import { auctions, auctionWinner, bids, users } from "../../../shared/schema";
import { eq, sql } from "drizzle-orm";
import { auctionQueue } from "../queue";

// Add additional debug logging for Redis connection
connection.on('connect', () => {
  console.log('Redis client connected');
});

connection.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Add extra logging to diagnose if jobs are being properly registered
const auctionWorker = new Worker(
  "auction",
  async (job: any) => {
    console.log('Worker processing job:', job.id, job.name);
    
    if (job.name === "startAuction") {
      console.log('Starting auction job received with data:', job.data);
      const { auctionId, endTime } = job.data;
      const auctionRows: any = await db
        .select()
        .from(auctions)
        .where(eq(auctions.id, auctionId));
      const auction: any = auctionRows[0];
      console.log('Found auction:', auction);
      
      if (!auction) {
        console.error(`Auction with ID ${auctionId} not found`);
        return;
      }
      if (auction.status === "RUNNING" || auction.status === "ENDED") {
        console.log(`Auction ${auctionId} is already ${auction.status}`);
        return;
      }
      await db
        .update(auctions)
        .set({ status: "RUNNING" })
        .where(eq(auctions.id, auctionId));
      console.log(`Updated auction ${auctionId} status to RUNNING`);

      startCountdown(auctionId, endTime);
    } else if (job.name === "endAuction") {
      console.log("End auction job started with data:", job.data);
      const { auctionId } = job.data;
      const auctionRows: any = await db
        .select()
        .from(auctions)
        .where(eq(auctions.id, auctionId));
      const auction: any = auctionRows[0];
      console.log('Found auction for ending:', auction);
      
      if (!auction) {
        console.error(`Auction with ID ${auctionId} not found`);
        return;
      }
      if (auction.status === "ENDED") {
        console.log(`Auction ${auctionId} is already ${auction.status}`);
        return;
      }
      const [highestBid]: any = await db
        .select({
          bids,
          users,
        })
        .from(bids)
        .innerJoin(users, eq(bids.userId, users.id))
        .where(eq(bids.auctionId, auctionId))
        .orderBy(sql`${bids.bidAmount} DESC`)
        .limit(1);

      let winnerId: any = null;
      if (highestBid && highestBid.bids.id) {
        winnerId = highestBid.bids.userId;
        await db.insert(auctionWinner).values({
          auctionId: auctionId,
          userId: winnerId,
          bidId: highestBid.bids.id,
          bidAmount: highestBid.bids.bidAmount,
          userEmail: highestBid.users.email,
          username: highestBid.users.username,
          createdAt: new Date(),
        });
        console.log(`Winner found for auction ${auctionId}:`, winnerId);
      } else {
        console.log(`No bids found for auction ${auctionId}`);
      }

      await db
        .update(auctions)
        .set({ status: "ENDED" })
        .where(eq(auctions.id, auctionId));
      console.log(`Updated auction ${auctionId} status to ENDED`);
    }
  },
  { 
    connection,
    // Add options for better debugging
    concurrency: 5,
    lockDuration: 30000,
    stalledInterval: 30000
  }
);

// Register event listeners
auctionWorker.on("ready", () => {
  console.log("Auction Worker is ready and connected to Redis");
});

auctionWorker.on("error", (err) => {
  console.error("Auction Worker error:", err);
});

auctionWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed with error:`, err);
});

auctionWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

auctionWorker.on("stalled", (jobId) => {
  console.warn(`Job ${jobId} has stalled`);
});

auctionWorker.on("active", (job) => {
  console.log(`Job ${job.id} has started processing`);
});



const auctionCountdownIntervals = new Map<string, NodeJS.Timeout>();

function startCountdown(auctionId: string, endTime: string) {
  console.log(`Starting countdown for auction ${auctionId} until ${endTime}`);
  const interval = setInterval(async () => {
    const now = new Date();
    const remainingTime = new Date(endTime).getTime() - now.getTime();

    console.log(`Auction ${auctionId} remaining time: ${remainingTime}ms`);

    if (remainingTime <= 0) {
      console.log(`Countdown finished for auction ${auctionId}, scheduling end auction job`);
      clearInterval(interval);
      auctionCountdownIntervals.delete(auctionId);

      // Optionally schedule next job to declare winner, etc.
      try {
        const job: any = await auctionQueue.add("endAuction", {
          auctionId: auctionId,
        });
        console.log(`End auction job added to queue with ID: ${job.id}`);
      } catch (error: any) {
        console.error('Failed to add endAuction job to queue:', error);
      }
    } else {
      try {
        connection.publish(
          `AUCTION_TIMER:${auctionId}`,
          JSON.stringify({
            auctionId,
            remainingTime,
          })
        );
      } catch (error: any) {
        console.error('Failed to publish auction timer:', error);
      }
    }
  }, 1000);

  auctionCountdownIntervals.set(auctionId, interval);
}

async function initActiveAuctionsCountdowns() {
  console.log("Initializing active auctions countdowns");
  try {
    const activeAuctions: any = await db
      .select()
      .from(auctions)
      .where(eq(auctions.status, "RUNNING"));

    console.log(`Found ${activeAuctions.length} active auctions`);

    activeAuctions.forEach((auction: any) => {
      const remainingTime = new Date(auction.endDate).getTime() - Date.now();
      console.log(`Auction ${auction.id} remaining time: ${remainingTime}ms`);
      
      startCountdown(auction.id.toString(), auction.endDate.toISOString());
    });
    
    // Check for auctions that should be started
    const upcomingAuctions: any = await db
      .select()
      .from(auctions)
      .where(eq(auctions.status, "UPCOMING"));
      
    console.log(`Found ${upcomingAuctions.length} upcoming auctions`);
    
    for (const auction of upcomingAuctions) {
      const startDelay = new Date(auction.startDate).getTime() - Date.now();
      console.log(`Auction ${auction.id} start delay: ${startDelay}ms`);
      
      // If the start time is in the past or very soon (within 1 second)
      if (startDelay <= 1000) {
        console.log(`Auction ${auction.id} should be started immediately`);
        await db
          .update(auctions)
          .set({ status: "RUNNING" })
          .where(eq(auctions.id, auction.id));
          
        startCountdown(auction.id.toString(), auction.endDate.toISOString());
      } else {
        // Re-schedule the job with the correct delay
        try {
          const job: any = await auctionQueue.add(
            "startAuction",
            {
              auctionId: auction.id,
              endTime: auction.endDate,
            },
            {
              delay: startDelay,
            }
          );
          console.log(`Rescheduled start job for auction ${auction.id} with job ID: ${job.id}`);
        } catch (error: any) {
          console.error(`Failed to reschedule start job for auction ${auction.id}:`, error);
        }
      }
    }
  } catch (e: any) {
    console.error("Error in initActiveAuctionsCountdowns:", e);
    throw e;
  }
}

// Add function to manually check the queue status
async function checkQueueStatus() {
  console.log('Checking auction queue status');
  try {
    const waitingCount: any = await auctionQueue.getWaitingCount();
    const activeCount: any = await auctionQueue.getActiveCount();
    const delayedCount: any = await auctionQueue.getDelayedCount();
    const completedCount: any = await auctionQueue.getCompletedCount();
    const failedCount: any = await auctionQueue.getFailedCount();
    
    console.log('Queue status:', {
      waiting: waitingCount,
      active: activeCount,
      delayed: delayedCount,
      completed: completedCount,
      failed: failedCount
    });
    
    // Get delayed jobs to inspect them
    const delayedJobs: any = await auctionQueue.getDelayed();
    console.log(`Delayed jobs count: ${delayedJobs.length}`);
    for (const job of delayedJobs) {
      const processingIn: any = job.delay;
      console.log(`Job ${job.id} (${job.name}) will process in ${processingIn}ms, data:`, job.data);
    }
  } catch (error: any) {
    console.error('Failed to check queue status:', error);
  }
}

// Initialize and then check queue status
initActiveAuctionsCountdowns()
  .then(() => {
    console.log('----------------Active auctions initialization completed---------');
    return checkQueueStatus();
  })
  .catch((error) => {
    console.error("Error initializing active auctions countdowns:", error);
  });