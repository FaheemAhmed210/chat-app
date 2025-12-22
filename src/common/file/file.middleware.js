const createError = require("http-errors");
const { StatusCodes } = require("http-status-codes");

module.exports.fileRequired = function (fieldName) {
  return (req, res, next) => {
    if (!req.file) {
      throw createError(
        StatusCodes.BAD_REQUEST,
        `File ${fieldName} is required`
      );
    }
    next();
  };
};

module.exports.filesRequired = function (fields) {
  return (req, res, next) => {
    const filesName = Object.keys(req.files);
    const fieldsImageName = fields.map((el) => el.name);
    const validateFilesFields =
      JSON.stringify(filesName) === JSON.stringify(fieldsImageName);
    const errorField = fieldsImageName.filter((el) => !filesName.includes(el));

    if (!validateFilesFields) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        statusCode: StatusCodes.BAD_REQUEST,
        message: `File is required`,
        detial: { key: errorField },
      });
    }
    next();
  };
};
