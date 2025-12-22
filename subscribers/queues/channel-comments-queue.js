const Queue = require("bull");
const { redis } = require("../../configs");
const ChannelCommentsQueue = new Queue("channel-comments", {
  redis: redis.host,
});
ChannelCommentsQueue.on("waiting", (jobId) => {
  // console.log(`Job ${jobId} is waiting to be processed.`);
});
ChannelCommentsQueue.on("active", (job) => {
  console.log(`Job ${job.id} is now active.`);
});
ChannelCommentsQueue.on("completed", (job) => {
  console.log(`Job ${job.id} has been completed.`);
});
ChannelCommentsQueue.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed with error:`, err.message);
});

ChannelCommentsQueue.on("SIGINT", async () => {
  console.log("Closing notification queue...");
  await ChannelCommentsQueue.close();
  console.log("Channels queue closed.");
});
module.exports = ChannelCommentsQueue;
