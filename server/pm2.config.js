module.exports = {
  apps: [
    {
      name: "apiServer",
      script: "./dist/server/index.js",
    },
    {
      name: "websocketServer",
      script: "./dist/server/ws/index.js",
    },
    {
      name: "auction-worker",
      script: "./dist/server/worker/jobs/auction.js",
    },
    {
      name: "bid-worker",
      script: "./dist/server/worker/jobs/bidProcess.js",
    },
    {
      name: "cleanup-worker",
      script: "./dist/server/worker/jobs/cleanupJob.js",
    },
    {
      name: "notification-worker",
      script: "./dist/server/worker/jobs/notificationJob.js",
    },
    {
      name: "package-worker",
      script: "./dist/server/worker/jobs/packageJob.js",
    },
    {
      name: "payment-worker",
      script: "./dist/server/worker/jobs/paymentProcess.js",
    },
    {
      name: "raffle-worker",
      script: "./dist/server/worker/jobs/raffle.js",
    },
  ],
};
