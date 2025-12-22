const { StatusCodes } = require("http-status-codes");

exports.checkHealth = (req, res, next) => {
  return res.status(StatusCodes.OK).json({
    statusCode: StatusCodes.OK,
    message: "Chat is running fine",
  });
};
