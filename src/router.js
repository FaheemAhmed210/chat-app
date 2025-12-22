const globalRouter = require("express").Router();

const chatsRouter = require("./chats/chats.router");
const mediasRouter = require("./medias/medias.router");
const groupsRouter = require("./groups/groups.router");

const blockUsersRouter = require("./blocked-users/blocked-users.router");
const healthRouter = require("./health/health.router");
const collectionsRounter = require("./collections/collections.router");

exports.initRoutes = (app) => {
  app.use("/collections", globalRouter);

  globalRouter.use("/medias", mediasRouter);
  globalRouter.use("/groups", groupsRouter);

  globalRouter.use("/block-users", blockUsersRouter);
  globalRouter.use("/chats", chatsRouter);

  globalRouter.use("/health", healthRouter);
  globalRouter.use("/", collectionsRounter);
};
