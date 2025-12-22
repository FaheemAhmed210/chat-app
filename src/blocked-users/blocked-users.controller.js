const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const blockedUsersService = require("./blocked-users.service");

exports.create = async (req, res, next) => {
  try {
    const createBLockedUsersDto = {
      blockerId: req.user.id,
      blockedId: req.body.userId,
      ...req.body,
    };

    const result = await blockedUsersService.create(createBLockedUsersDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "User blocked successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
