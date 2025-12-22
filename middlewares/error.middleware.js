const { StatusCodes } = require("http-status-codes");

module.exports = (err, req, res, next) => {
  if (!err.statusCode || err.statusCode == StatusCodes.INTERNAL_SERVER_ERROR) {
    console.log(err);
  }
  res.status(err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    message: err.message || "Something went wrong",
    details: err.details ? err.details : null,
  });
};
