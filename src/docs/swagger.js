const YAML = require("yamljs");
const swaggerDocument = YAML.load("src/docs/swagger.yaml");
const swaggerUi = require("swagger-ui-express");

const swaggerOptions = {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: `Tomi Wallet Api Docs`,
  customfavIcon: "/images/favicon.ico",
};

module.exports.setupSwagger = (app) => {
  if (process.env.NODE_ENV !== "production") {
    app.use(
      "/collections/api-docs",
      swaggerUi.serveFiles(swaggerDocument, {}),
      swaggerUi.setup(swaggerDocument, swaggerOptions)
    );
  }
};
