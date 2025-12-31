const { StatusCodes } = require("http-status-codes");
const usersService = require("./users.service");
const {
  handleServiceResult,
} = require("../common/errors/handle-service-result.js");

exports.getUser = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await usersService.findById(userId);

    const data = handleServiceResult(result);

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Get User Successfully",
      data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const result = await usersService.findById(userId);

    const data = handleServiceResult(result);

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Get User Successfully",
      data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updateUsersDto = { ...req.body };
    const result = await usersService.findByIdAndUpdate(userId, updateUsersDto);

    const data = handleServiceResult(result);

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "User Updated Successfully",
      data,
    });
  } catch (ex) {
    next(ex);
  }
};
