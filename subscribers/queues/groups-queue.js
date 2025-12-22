const Queue = require("bull");
const { redis } = require("../../configs");
const GroupsQueue = new Queue("groups", {
  redis: redis.host,
});
GroupsQueue.on("waiting", (jobId) => {
  // console.log(`Job ${jobId} is waiting to be processed.`);
});
GroupsQueue.on("active", (job) => {
  console.log(`Job ${job.id} is now active.`);
});
GroupsQueue.on("completed", (job) => {
  console.log(`Job ${job.id} has been completed.`);
});
GroupsQueue.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed with error:`, err.message);
});

GroupsQueue.on("SIGINT", async () => {
  console.log("Closing notification queue...");
  await GroupsQueue.close();
  console.log("Groups queue closed.");
});
module.exports = GroupsQueue;
