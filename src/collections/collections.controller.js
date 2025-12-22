const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const collectionsService = require("./collections.service");

exports.listCollections = async (req, res, next) => {
  try {
    const listCollectionsDto = { ...req.query, userId: req.user.id };
    const result = await collectionsService.listCollections(listCollectionsDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Collections Requests",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
