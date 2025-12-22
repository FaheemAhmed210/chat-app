require("dotenv").config();
const express = require("express");
const { applyMiddlewares, applyErrorMdiddlewares } = require("./middlewares");
const { initRoutes } = require("./src/router");
const redisClient = require("./helpers/redis");
const { registerSubscribers } = require("./subscribers");
// const { initializeKafka } = require("./src/common/kafka/kafka-init");

const registerScheduledJobs = require("./jobs");
const app = express();

(async () => {
  // initialize redis store
  await redisClient.connect();
  // initialize database
  require("./helpers/db");
  // register all event subscribers
  registerSubscribers();
  require("./configs/env-validation");
  require("./helpers/db.seeder");
  require("./subscribers/processors/chat-processor");
  require("./subscribers/processors/group-processor");
  // initializeKafka();
})();

// set ejs view engine
// app.set("view engine", "ejs");

// configure middlewares globally
applyMiddlewares(app);

// initialize routes
initRoutes(app);

// configure error middlewares
applyErrorMdiddlewares(app);

// register Cron jobs
registerScheduledJobs();

module.exports = app;
