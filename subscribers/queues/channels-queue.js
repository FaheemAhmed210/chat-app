const Queue = require("bull");
const { redis } = require("../../configs");
const ChannelsQueue = new Queue("channels", {
  redis: redis.host,
});
ChannelsQueue.on("waiting", (jobId) => {
  // console.log(`Job ${jobId} is waiting to be processed.`);
});
ChannelsQueue.on("active", (job) => {
  console.log(`Job ${job.id} is now active.`);
});
ChannelsQueue.on("completed", (job) => {
  console.log(`Job ${job.id} has been completed.`);
});
ChannelsQueue.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed with error:`, err.message);
});

ChannelsQueue.on("SIGINT", async () => {
  console.log("Closing notification queue...");
  await ChannelsQueue.close();
  console.log("Channels queue closed.");
});
module.exports = ChannelsQueue;
