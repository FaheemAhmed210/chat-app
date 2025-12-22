const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");

module.exports = (req, res, next) => {
  next(
    createError(
      StatusCodes.NOT_FOUND,
      `collections ${req.originalUrl} Not Found`
    )
  );
};
