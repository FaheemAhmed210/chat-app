const chatsRouter = require("./chats/chats.router");
const mediasRouter = require("./medias/medias.router");
const groupsRouter = require("./groups/groups.router");
const blockUsersRouter = require("./blocked-users/blocked-users.router");
const healthRouter = require("./health/health.router");
const collectionsRounter = require("./collections/collections.router");
const authRouter = require("./auth/auth.router");
exports.initRoutes = (app) => {
  authRouter.initRoutes(app);
  app.use("/collections", collectionsRounter);
  app.use("/medias", mediasRouter);
  app.use("/groups", groupsRouter);
  app.use("/block-users", blockUsersRouter);
  app.use("/chats", chatsRouter);
  app.use("/health", healthRouter);
};
