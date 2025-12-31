const usersSerice = require("./users.service");
const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");

const configs = require("../../configs");

exports.checkUser = async (req, res, next) => {
  try {
    const { id: userId } = req.user;

    const { userName } = req.body;

    const result = await usersSerice.findById(userId);

    if (result.userNotFound)
      throw createError(StatusCodes.NOT_FOUND, "User Not found");

    const user = result.data;

    if (userName) {
      if (user?.userName)
        throw createError(StatusCodes.FORBIDDEN, "Username already set");

      const userNameResp = await usersSerice.findOne({ userName });

      if (userNameResp.data) {
        throw createError(StatusCodes.CONFLICT, "Username already in use");
      }
    }

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.checkUdidBlockedStatus = async (req, res, next) => {
  try {
    const { udid } = req.body;

    const result = await usersSerice.findOne({ udid, isBlocked: true });

    if (result.data)
      throw createError(StatusCodes.UNAUTHORIZED, "Udid is blocked");

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.verifySecret = async (req, res, next) => {
  try {
    const { secret } = req.body;

    if (secret !== configs.secret)
      throw createError(StatusCodes.UNAUTHORIZED, "not authorised");

    next();
  } catch (ex) {
    next(ex);
  }
};
