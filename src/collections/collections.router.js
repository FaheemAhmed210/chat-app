const router = require("express").Router();
const { validate } = require("express-validation");
const collectionsController = require("./collections.controller");
const collectionsValidation = require("./collections.validation");
const JWT = require("../common/auth/jwt");

router.get(
  "/",
  [
    JWT.verifyAccessToken,
    validate(collectionsValidation.listCollections, { keyByField: true }),
  ],
  collectionsController.listCollections
);

module.exports = router;
