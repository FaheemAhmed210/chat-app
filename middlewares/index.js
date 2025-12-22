const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const errorMiddleware = require("./error.middleware");
const notFoundMiddleware = require("./404.middleware");
const { setupSwagger } = require("../src/docs/swagger");
const sanitizeAll = require("./sanitize");
module.exports.applyMiddlewares = (app) => {
  app.use(cors());
  app.disable("x-powered-by");

  app.use(express.static("public"));

  app.use(
    morgan(":method :url :status :res[content-length] - :response-time ms")
  );
  setupSwagger(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(sanitizeAll);
  app.use(express.urlencoded({ extended: true }));
};

module.exports.applyErrorMdiddlewares = (app) => {
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);
};
