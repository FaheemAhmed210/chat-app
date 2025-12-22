const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const blockedUserService = require("./blocked-users.service");

exports.checkUser = async (req, res, next) => {
  try {
    const { id: blockerId } = req.user;
    const { userId: blockedId, isBlocked } = req.body;

    const result = await blockedUserService.findOne({
      blockerId,
      blockedId,
    });

    if (result.ex) throw result.ex;

    if (isBlocked && result.data)
      throw createError(StatusCodes.CONFLICT, "User Already blocked");
    if (!isBlocked && result.userNotFound)
      throw createError(StatusCodes.CONFLICT, "User not blocked");

    next();
  } catch (ex) {
    next(ex);
  }
};
