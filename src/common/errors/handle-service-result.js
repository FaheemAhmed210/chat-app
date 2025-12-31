const createError = require("http-errors");
const { StatusCodes } = require("http-status-codes");

exports.handleServiceResult = (result) => {
  if (result.ex) throw result.ex;
  if (result.data) return result.data;
  if (result.isUnauthorized)
    throw createError(StatusCodes.UNAUTHORIZED, result.exMessage);
  if (result.hasConflict)
    throw createError(StatusCodes.CONFLICT, result.exMessage);
  if (result.isForbidden)
    throw createError(StatusCodes.FORBIDDEN, result.exMessage);
  if (result.notFound)
    throw createError(StatusCodes.NOT_FOUND, result.exMessage);
};
