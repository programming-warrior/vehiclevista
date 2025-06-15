// auctionQueue.ts
import { Queue } from "bullmq";
import { connection } from "./workerRedis";
console.log("bullmq connected to redis");

export const auctionQueue = new Queue("auction", { connection });

export const bidQueue= new Queue("bid", { connection })

export const raffleQueue = new Queue("raffle", { connection })

export const cleanupQueue = new Queue("cleanup",{connection});

export const paymentQueue = new Queue("payment",{connection})

export const notificationQueue = new Queue("notification", { connection });

export const packageQueue = new Queue("package", { connection });



