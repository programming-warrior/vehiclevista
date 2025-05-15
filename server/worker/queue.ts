// auctionQueue.ts
import { Queue } from "bullmq";
import { connection } from "./workerRedis";
console.log("bullmq connected to redis");

export const auctionQueue = new Queue("auction", { connection });

export const bidQueue= new Queue("bid", { connection })

export const raffleQueue = new Queue("raffle", { connection })


