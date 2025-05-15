import { Worker } from "bullmq";
import { connection } from "../workerRedis";
import { deleteImagesFromS3 } from "../../utils/s3";


const cleanupWorker = new Worker(
  "cleanup",
  async (job) => {
    console.log(job.name);
    console.log(job.data)
    if (job.name === "delete-s3-images") {
      const { image_urls } = job.data;
       await deleteImagesFromS3(image_urls);
       console.log('Orphaned images deleted from s3');
    }

  },
  { connection }
);

cleanupWorker.on("ready", () => {
  console.log("Cleanup Worker is ready and connected to Redis");
});

cleanupWorker.on('error',(e)=>{
  console.log(e);
})

cleanupWorker.on("failed", (job, err: any) => {
  console.log("bid failed");
  console.log(job);

  connection.publish(
    `BID_PLACED_ERROR`,
    JSON.stringify({
      error: err.message,
      payload: {
        auctionId: job?.data.auctionId,
        userId: job?.data.userId, 
        bidAmount: job?.data.bidAmount, 
        raffleId: job?.data.raffleId,
        ticketQuantity: job?.data.ticketQuantity
      },
    })
  );
  console.log(err);
});
