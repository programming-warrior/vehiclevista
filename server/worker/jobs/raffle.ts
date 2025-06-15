import { Worker } from "bullmq";
import { connection } from "../workerRedis";
// import { WebSocketServer } from './websocket'; // assume you have a pub function
import { db } from "../../db";
import { raffle } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { raffleQueue } from "../queue";

const raffleWorker = new Worker(
  "raffle",
  async (job) => {
    console.log(job);
    if (job.name === "startRaffle") {
      console.log("startRaffle called");
      const { raffleId, endTime } = job.data;
      const raffleRow = await db
        .select()
        .from(raffle)
        .where(eq(raffle.id, raffleId));
      const raffleData = raffleRow[0];

      console.log(raffleData);
      if (!raffleData) {
        console.error(`Raffle with ID ${raffleId} not found`);
        return;
      }
      if (raffleData.status === "RUNNING" || raffleData.status === "ENDED") {
        console.log(`Raffle ${raffleId} is already ${raffleData.status}`);
        return;
      }
      await db
        .update(raffle)
        .set({ status: "RUNNING" })
        .where(eq(raffle.id, raffleId));

      startCountdown(raffleId, endTime);
    } else if (job.name === "endRaffle") {
      console.log("end raffle job started");
      const { raffleId } = job.data;
      const raffleRows = await db
        .select()
        .from(raffle)
        .where(eq(raffle.id, raffleId));
      const raffleData = raffleRows[0];
      console.log(raffleData);
      if (!raffleData) {
        console.error(`raffle with ID ${raffleId} not found`);
        return;
      }
      if (raffleData.status === "ENDED") {
        console.log(`raffle ${raffleId} is already ${raffleData.status}`);
        return;
      }
      await db
        .update(raffle)
        .set({ status: "ENDED" })
        .where(eq(raffle.id, raffleId));
    }
  },
  { connection }
);

const raffleCountdownIntervals = new Map<string, NodeJS.Timeout>();

function startCountdown(raffleId: string, endTime: string) {
  const interval = setInterval(async () => {
    const now = new Date();
    const remainingTime = new Date(endTime).getTime() - now.getTime();

    console.log(remainingTime);
    // WebSocketServer.broadcastToraffle(raffleId, {
    //   type: 'countdown',
    //   raffleId,
    //   remaining,
    // });
    console.log("timer published to redis");
    connection.publish(
      `RAFFLE_TIMER:${raffleId}`,
      JSON.stringify({
        raffleId,
        remainingTime,
      })
    );

    if (remainingTime <= 0) {
      clearInterval(interval);

      raffleCountdownIntervals.delete(raffleId);
      //   WebSocketServer.broadcastToraffle(raffleId, {
      //     type: 'raffleEnded',
      //     raffleId,
      //   });

      // Optionally schedule next job to declare winner, etc.
      await raffleQueue.add("endRaffle", {
        raffleId: raffleId,
      });
    }
  }, 1000);

  raffleCountdownIntervals.set(raffleId, interval);
}

async function initActiverafflesCountdowns() {
  try {
    const runningRaffle = await db
      .select()
      .from(raffle)
      .where(eq(raffle.status, "RUNNING"));

      //there will only be on raffle running at a time 
    if (runningRaffle[0]) {
      const remainingTime =
        new Date(runningRaffle[0].endDate).getTime() - Date.now();
      console.log(remainingTime);
      if (remainingTime > 0) {
        console.log("startcountdown called for running raffles");
        startCountdown(
          runningRaffle[0].id.toString(),
          runningRaffle[0].endDate.toISOString()
        );
      } else {
        console.log("updating raffle status to ended");
        await db
          .update(raffle)
          .set({ status: "ENDED" })
          .where(eq(raffle.id, runningRaffle[0].id));

        console.log(runningRaffle[0].id + " status updated to ended");
      }
    }
    raffleWorker.on("ready", () => {
      console.log("raffle Worker is ready and connected to Redis");
    });
  } catch (e) {
    console.log(e);
  }
}

initActiverafflesCountdowns().catch((error) => {
  console.error("Error initializing active raffle countdowns:", error);
});
