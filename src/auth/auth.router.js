const usersAuthRouter = require("./users/auth.router");

module.exports.initRoutes = (app) => {
  app.use("/auth/users", usersAuthRouter);
};
