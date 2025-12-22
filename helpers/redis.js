const { createClient } = require("redis");
const configs = require("../configs");

const client = createClient({
  url: configs.redis.host,
});

client.on("connect", () => {
  console.log("Client connected to redis...");
});

client.on("ready", () => {
  console.log("Client connected to redis and ready to use...");
});

client.on("error", (err) => {
  console.log(err.message);
});

client.on("end", () => {
  console.log("Client disconnected from redis");
});

client.on("SIGINT", () => {
  client.quit();
});

module.exports = client;
