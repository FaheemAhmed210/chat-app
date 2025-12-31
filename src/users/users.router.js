const router = require("express").Router();
const { validate } = require("express-validation");
const usersController = require("./users.controller");
const usersValidation = require("./users.validation");
const { checkUser } = require("./users.middleware");

const JWT = require("../common/auth/jwt");

router.get("/profile", [JWT.verifyAccessToken], usersController.getUser);

router.get(
  "/:id",
  [
    JWT.verifyAccessToken,
    validate(usersValidation.idInParams, { keyByField: true }),
  ],
  usersController.getUserById
);

router.patch(
  "/",
  [
    JWT.verifyAccessToken,
    validate(usersValidation.updateUser, { keyByField: true }),
    checkUser,
  ],
  usersController.updateUser
);

module.exports = router;
