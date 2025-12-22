const Queue = require("bull");
const { redis } = require("../../configs");
const ChatsQueue = new Queue("chats", {
  redis: redis.host,
});
ChatsQueue.on("waiting", (jobId) => {
  // console.log(`Job ${jobId} is waiting to be processed.`);
});
ChatsQueue.on("active", (job) => {
  console.log(`Job ${job.id} is now active.`);
});
ChatsQueue.on("completed", (job) => {
  console.log(`Job ${job.id} has been completed.`);
});
ChatsQueue.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed with error:`, err.message);
});

ChatsQueue.on("SIGINT", async () => {
  console.log("Closing notification queue...");
  await ChatsQueue.close();
  console.log("Chats queue closed.");
});
module.exports = ChatsQueue;
