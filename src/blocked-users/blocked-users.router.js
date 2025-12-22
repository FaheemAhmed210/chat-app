const router = require("express").Router();
const { validate } = require("express-validation");
const blockedUsersController = require("./blocked-users.controller");
const blockedUsersValidation = require("./blocked-users.validation");
const { checkUser } = require("./blocked-users.middleware");
const JWT = require("../common/auth/jwt");
router.post(
  "/",
  [
    JWT.verifyAccessToken,
    validate(blockedUsersValidation.create, { keyByField: true }),
    checkUser,
  ],

  blockedUsersController.create
);

module.exports = router;
